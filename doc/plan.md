# 📋 PLAN TRIỂN KHAI HẠ TẦNG — Supervision & Detection System

---

# PHẦN CHÍNH — LỘ TRÌNH TRIỂN KHAI

---

## Giai đoạn 1 — Phân tích kiến trúc hạ tầng

> Xác định kiến trúc tổng thể và lý do lựa chọn từng công nghệ trước khi bắt đầu triển khai.

### Kiến trúc Local (Phát triển & Test)

```
              Internet
                  │
              Ingress
                  │
          Kubernetes (Minikube)
                  │
      ┌───────────┼───────────┐
      │           │           │
   Frontend    Backend    Monitoring
                  │
            MongoDB Atlas
```

### Kiến trúc Cloud (Production — chi tiết ở Giai đoạn 12)

```
Internet → AWS IGW → ALB (Public Subnet) → EKS Node (Private Subnet) → Pod
```

### Lý do lựa chọn công nghệ

| Công nghệ | Lý do |
|---|---|
| Kubernetes | Orchestration, tự động scale, self-healing |
| MongoDB Atlas | Managed database, không cần quản lý storage trong cluster |
| Prometheus + Loki | Metrics + Logs native cho Kubernetes, nhẹ hơn ELK |
| Grafana | Visualization đa datasource trên một Dashboard duy nhất |
| AlertManager | Tập trung xử lý cảnh báo, route đến nhiều kênh |
| GitHub Actions | CI/CD tích hợp sẵn với GitHub |

---

## Giai đoạn 2 — Chuẩn bị môi trường

### Local

```bash
# Cài đặt
docker, kubectl, minikube, helm, git

# Kiểm tra
docker version
kubectl version --client
minikube status
```

### Cloud (sau khi Local ổn định)

```bash
# Cài đặt thêm
aws-cli, eksctl, kubectl
```

---

## Giai đoạn 3 — Containerization

```
Frontend Source  →  Dockerfile  →  Docker Image
Backend Source   →  Dockerfile  →  Docker Image
                                        │
                                   Registry (ECR)
```

- Build Docker Image cho **Frontend** và **Backend**
- Push lên Registry

```bash
docker build -t backend:v1 .
docker push <ecr-url>/backend:v1
```

---

## Giai đoạn 4 — Triển khai Kubernetes Local

> Chương lớn nhất. Thứ tự các mục theo đúng Kubernetes deployment flow:
> **Namespace → Config → Deployment → Resource → Probe → Service → Ingress → Security → Storage**

---

### 4.1 Namespace

- Tách biệt môi trường, tránh xung đột tên resource

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: supervision-dev
```

---

### 4.2 ConfigMap

- Lưu cấu hình không nhạy cảm: `PORT`, `TIMEZONE`, `PROFILE`
- Thay đổi config không cần rebuild image

---

### 4.3 Secret

- Lưu thông tin nhạy cảm: `MONGO_URI`, `JWT_SECRET`, `DB_PASSWORD`
- Không hardcode vào source code hoặc image

> 💡 **Hội đồng hỏi:** *"Tại sao không đặt connection string trực tiếp trong code?"*

---

### 4.4 Deployment

- Khai báo cách chạy Pod cho **Backend**, **Frontend**, **Monitoring**

| Khái niệm | Ý nghĩa |
|---|---|
| Replica | Số Pod chạy song song |
| Rolling Update | Deploy không có downtime |
| Image | Version cụ thể từ Registry |

---

### 4.5 Resource Management

- Kiểm soát CPU/RAM cho từng Pod, đảm bảo cluster ổn định

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "1000m"
    memory: "1Gi"
```

#### Request vs Limit

| Khái niệm | Ý nghĩa |
|---|---|
| **Request** | Lượng tài nguyên tối thiểu — Scheduler dùng để chọn Node |
| **Limit** | Lượng tài nguyên tối đa — vượt qua bị throttle (CPU) hoặc OOMKilled (RAM) |

#### Scheduler hoạt động thế nào

```
Pod yêu cầu: cpu=500m, memory=512Mi
                    │
         Scheduler tìm Node phù hợp
                    │
         Node A: còn 600m CPU, 1Gi RAM → ✅ Chọn
         Node B: còn 200m CPU, 2Gi RAM → ❌ CPU không đủ
                    │
         Pod chạy trên Node A
                    │
         Nếu vượt Memory Limit → OOMKilled → restart
         Nếu vượt CPU Limit    → throttle (chậm lại, không kill)
```

> 💡 **Hội đồng hỏi:** *"Nếu không đặt Limit, điều gì xảy ra?"*
>
> **Trả lời:** Một Pod có thể ăn hết tài nguyên Node, kéo sập toàn bộ Pod khác trên Node đó — "noisy neighbor" problem.

---

### 4.6 Health Check — Kubernetes Probes

#### Ba loại Probe và thứ tự hoạt động

```
Pod khởi động
      │
      ▼
[1] startupProbe
      │  Chờ app khởi động xong (JVM, Spring Boot...)
      │  fail → restart Pod
      │  pass → bật probe tiếp theo
      ▼
[2] livenessProbe  (chạy liên tục)
      │  Kiểm tra app còn sống không
      │  fail → Kubernetes restart Pod tự động
      ▼
[3] readinessProbe  (chạy liên tục)
      │  Kiểm tra app đã sẵn sàng nhận request chưa
      │  fail → remove Pod khỏi Service (không route traffic)
      │  pass → Pod nhận traffic bình thường
```

#### Luồng traffic qua readinessProbe

```
Client
  │
  ▼
Service
  │  chỉ route đến Pod có readinessProbe = Pass
  ├──▶ Pod A (Ready ✅)  ← nhận traffic
  ├──▶ Pod B (Ready ✅)  ← nhận traffic
  └──▶ Pod C (Not Ready ❌) ← bị loại khỏi routing
```

#### Ví dụ cấu hình (Spring Boot Actuator)

```yaml
startupProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  failureThreshold: 30
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

> 💡 **Hội đồng hỏi:** *"App bị treo (hang) nhưng process vẫn còn sống, Kubernetes có biết không?"*
>
> **Trả lời:** Có — `livenessProbe` gọi HTTP endpoint, nếu không có response trong timeout → restart Pod tự động dù process không crash.

> 💡 **Hội đồng hỏi:** *"Trong quá trình Rolling Update, làm sao đảm bảo Pod mới thực sự sẵn sàng trước khi nhận traffic?"*
>
> **Trả lời:** `readinessProbe` — Pod mới chỉ được đưa vào Service sau khi probe pass. Pod cũ vẫn phục vụ trong thời gian chờ.

---

### 4.7 Service & Service Discovery

#### Các loại Service

| Loại | Dùng cho | Lý do |
|---|---|---|
| `ClusterIP` | Backend | Chỉ truy cập nội bộ, bảo mật hơn |
| `LoadBalancer` | Frontend | Expose ra ngoài |
| `NodePort` | Debug local | Truy cập qua port Node |

#### Service Discovery — tích hợp sẵn trong Kubernetes

Kubernetes DNS (CoreDNS) tự cấp hostname cho mỗi Service.
Không cần biết IP — chỉ cần gọi theo tên Service.

```
Backend gọi: http://user-service:8080
                       │
               CoreDNS resolve
                       │
               ClusterIP → Pod đang Ready
```

> 💡 **Hội đồng hỏi:** *"Pod bị xóa và tạo lại với IP khác, các service khác có cần cập nhật config không?"*
>
> **Trả lời:** Không — Service Discovery dùng tên Service, không dùng IP. Kubernetes tự cập nhật routing.

---

### 4.8 Ingress

- **Routing:** `/api/*` → Backend, `/*` → Frontend
- **TLS Termination:** Giải mã HTTPS tại Ingress
- **cert-manager:** Tự động cấp và gia hạn chứng chỉ TLS

```
cert-manager → ClusterIssuer → Certificate → Secret → Ingress
```

> 💡 **Hội đồng hỏi:** *"Dữ liệu truyền qua mạng có được bảo vệ không?"*

---

### 4.9 RBAC

- Nguyên tắc **Least Privilege**: chỉ cấp quyền tối thiểu cần thiết

| ServiceAccount | Quyền | Phạm vi |
|---|---|---|
| `backend-sa` | Đọc ConfigMap, Secret | Namespace riêng |
| `monitoring-sa` | Đọc metrics | Toàn cluster (ClusterRole) |

> 💡 **Hội đồng hỏi:** *"Nếu Backend Pod bị hack, hacker có thể kiểm soát cluster không?"*
>
> **Trả lời:** Không — RBAC giới hạn, không thể leo thang ra ngoài namespace.

---

### 4.10 Network Policy

- Mặc định Kubernetes cho phép **tất cả Pod nói chuyện với nhau** — Network Policy giới hạn điều này

```
Frontend  ──[allow]──▶  Backend
Backend   ──[allow]──▶  MongoDB Atlas (egress)
Monitoring──[allow]──▶  Tất cả namespace (scrape)
Khác      ──[deny] ──▶  Bị từ chối
```

---

### 4.11 Storage

- Dùng **MongoDB Atlas** → không cần PV/PVC trong cluster
- Atlas tự quản lý: storage, backup, replication, high availability

> 💡 **Hội đồng hỏi:** *"Nếu Pod database bị xóa, dữ liệu có mất không?"*
>
> **Trả lời:** Không — database không chạy trong cluster, Atlas quản lý hoàn toàn.

---

## Giai đoạn 5 — Monitoring Infrastructure

### 🎯 Mục tiêu
Xây dựng hệ thống giám sát tập trung cho toàn bộ cluster và ứng dụng.

### Thành phần

| Công cụ | Vai trò |
|---|---|
| **Metrics Server** | Cung cấp CPU/RAM real-time cho HPA |
| **Node Exporter** | Metrics máy chủ: CPU, RAM, Disk, Network |
| **kube-state-metrics** | Trạng thái Kubernetes: Pod, Deployment, Replica |
| **Prometheus** | Scrape và lưu trữ metrics (TSDB) |
| **Grafana** | Trực quan hóa |
| **AlertManager** | Xử lý và gửi cảnh báo |

### Luồng dữ liệu

```
Node Exporter      ──┐
kube-state-metrics ──┼──▶  Prometheus (Scrape + TSDB)
Actuator           ──┘            │
                        ┌─────────┴──────────┐
                     Grafana           AlertManager
                  (Visualization)    (Alert Routing)
```

### 📚 Kiến thức sử dụng
- Prometheus, PromQL
- Spring Boot Actuator + Micrometer
- kube-state-metrics, Node Exporter

### ✅ Kết quả đạt được
- Thu thập metrics từ Cluster (Node, Pod, Deployment)
- Thu thập metrics từ Application (Request, Latency, JVM)
- Cung cấp đầu vào cho HPA và Alerting

---

## Giai đoạn 6 — Logging

### 🎯 Mục tiêu
Hoàn thiện bộ Observability: **Metrics** (Prometheus) + **Logs** (Loki) + **Alerts** (AlertManager).

### Stack

```
Pod (stdout/stderr)
        │
Fluent Bit (DaemonSet — 1 agent/Node)
        │  collect, parse, forward
        ▼
       Loki (Log Storage + Index)
        │
        ▼
     Grafana (Log Visualization)
```

> ✅ **Tại sao Loki thay vì ELK?**
> ELK rất nặng tài nguyên. **Prometheus + Loki + Grafana** là stack được Grafana Labs khuyến nghị cho Kubernetes — nhẹ hơn, tích hợp sẵn trên cùng một Grafana.

### Truy vấn log (LogQL)

```logql
# Tìm lỗi trong namespace supervision
{namespace="supervision", app="backend"} |= "ERROR"
```

### 📚 Kiến thức sử dụng
- Fluent Bit configuration, DaemonSet pattern
- Loki label strategy, LogQL

### ✅ Kết quả đạt được
- Log tập trung từ toàn bộ Pod
- Tìm lỗi theo thời gian, namespace, app
- Correlate log với metrics trên cùng Grafana Dashboard

> 💡 **Hội đồng hỏi:** *"Khi có lỗi, bạn tìm nguyên nhân bằng cách nào?"*
>
> **Trả lời:** Grafana Dashboard (metrics spike) → Loki (log tại thời điểm đó) → tìm root cause.

---

## Giai đoạn 7 — Alerting

### 🎯 Mục tiêu
Tự động phát hiện sự cố và thông báo kịp thời — không cần người theo dõi 24/7.

### Luồng

```
Prometheus (metric vượt ngưỡng)
        │
   AlertManager
        │
   ┌────┴────┐
 Email     Slack
```

### Alert Rules

| Alert | Ngưỡng | Mức độ |
|---|---|---|
| CPU Usage cao | > 80% / 5 phút | 🔴 CRITICAL |
| RAM Usage cao | > 85% | 🟡 WARNING |
| Pod CrashLoopBackOff | Liên tục | 🔴 CRITICAL |
| Replica thiếu | Available < min | 🔴 CRITICAL |
| HTTP 5xx Rate | > 1% | 🟡 WARNING |
| Log ERROR tăng | > 10/phút | 🟡 WARNING |

### 📚 Kiến thức sử dụng
- Prometheus Alerting Rules (YAML)
- AlertManager routing & receiver configuration
- Grafana Alerting panel

### ✅ Kết quả đạt được
- Phát hiện sự cố tự động
- Thông báo Slack/Email trong vài giây
- Dashboard hiển thị lịch sử alert

---

## Giai đoạn 8 — Dashboard

> Chi tiết thiết kế 5 Dashboard xem tại **Phụ lục D**.

Hệ thống có **5 Dashboard chuyên biệt** trên Grafana:

| Dashboard | Nguồn dữ liệu | Nội dung chính |
|---|---|---|
| 1. Infrastructure | Node Exporter | CPU, RAM, Disk, Network |
| 2. Kubernetes | kube-state-metrics | Pod, Deployment, Replica, Restart, Node |
| 3. Application | Actuator → Prometheus | Request, Latency, JVM, GC |
| 4. Alerting & Logs | AlertManager + Loki | Alert firing, Log ERROR stream |
| 5. CI/CD | GitHub Actions | Deploy version, Deploy time, Rollback |

> 📌 Ở môi trường Cloud: Dashboard 1 chuyển datasource từ Node Exporter sang **CloudWatch**.

---

## Giai đoạn 9 — Auto Scaling (HPA) 

```
Metrics Server (CPU real-time)
        │
       HPA (so sánh với targetCPUUtilizationPercentage)
        │
   Deployment → scale Pod tự động
        │
   ┌────┴────┬────────┐
  Pod 1    Pod 2    Pod 3  (scale out)
```

**Kiểm thử:** Tạo tải → CPU tăng → Metrics Server báo cáo → HPA kích hoạt → Replica tăng.

---

## Giai đoạn 10 — Performance Testing

### 🎯 Mục tiêu
Chứng minh hệ thống tự động scale và cảnh báo đúng khi bị tải cao.

### Công cụ

| Công cụ | Lý do |
|---|---|
| **k6** ⭐ | Nhẹ, viết JS, tích hợp CI/CD |
| JMeter | GUI, nhiều tính năng |

### Luồng kiểm thử

```
k6 (100 VU, 5 phút)
        │
    Backend (CPU tăng > 80%)
        │
   Metrics Server → HPA
        │
   Scale: 1 → 3 → 5 replica
        │
   ┌────┴─────────────────┐
Grafana realtime    AlertManager → Slack/Email
```

### 📚 Kiến thức sử dụng
- k6 scripting (JavaScript)
- Load testing patterns: ramp-up, constant load, spike
- Phân tích kết quả: throughput, latency, error rate

### ✅ Kết quả đạt được
- Xác minh HPA hoạt động đúng
- Dashboard thay đổi realtime theo tải
- Alert bắn đúng khi vượt ngưỡng

---

## Giai đoạn 11 — CI/CD

### 🎯 Mục tiêu
Tự động hóa build → deploy khi có thay đổi code, không downtime.

### Pipeline

```
git push → GitHub Actions
    │
    ├── Build Docker Image (tag = commit SHA)
    ├── Push → AWS ECR
    ├── Update image tag trong Deployment YAML
    └── kubectl apply → Rolling Update
                │
         kubectl rollout status (verify)
                │
         Grafana CI/CD Dashboard cập nhật
```

### Secrets trong GitHub Actions

```
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
KUBECONFIG  (hoặc OIDC — không cần long-lived credentials)
```

### 📚 Kiến thức sử dụng
- GitHub Actions workflow YAML
- AWS ECR authentication
- kubectl Rolling Update
- OIDC for AWS (không cần long-lived key)

### ✅ Kết quả đạt được
- Mỗi commit tự động build và deploy
- Rolling Update — không downtime
- Rollback dễ dàng: `kubectl rollout undo`

> 💡 **Hội đồng hỏi:** *"Deploy lên production có ảnh hưởng người dùng không?"*
>
> **Trả lời:** Không — Rolling Update thay Pod từng cái một. Pod cũ vẫn phục vụ trong khi Pod mới đang khởi động và qua readinessProbe.

---

## Giai đoạn 12 — Triển khai AWS

### 🎯 Mục tiêu
Migrate từ Local (Minikube) lên Cloud (Amazon EKS) với kiến trúc production-ready.

### Thay thế cốt lõi

```
Minikube  ──▶  Amazon EKS
```

Toàn bộ YAML manifest **giữ nguyên** — chỉ điều chỉnh một số cấu hình Cloud-specific.

### Network Architecture trên AWS

```
           Internet
               │
     Internet Gateway (IGW)
               │
    ┌──────────▼──────────┐
    │     Public Subnet    │
    │  AWS ALB             │
    │  NAT Gateway         │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │    Private Subnet    │
    │  EKS Worker Node 1   │
    │  EKS Worker Node 2   │
    │    │                 │
    │   Pod  Pod  Pod      │
    └─────────────────────┘
```

| Thành phần | Vai trò |
|---|---|
| **Internet Gateway** | Kết nối VPC với Internet |
| **Public Subnet** | Chứa ALB và NAT Gateway — có thể truy cập từ Internet |
| **Private Subnet** | Chứa EKS Worker Node — không expose trực tiếp |
| **NAT Gateway** | Cho Private Subnet gọi ra Internet (pull image, update) mà không bị gọi vào |
| **Route Table** | Public Subnet → IGW / Private Subnet → NAT Gateway |
| **Amazon EKS** | Managed Kubernetes |
| **Node Group** | EC2 instance chạy Pod |
| **AWS Load Balancer Controller** | Tích hợp ALB với Kubernetes Ingress |
| **AWS ECR** | Registry Docker Image |
| **AWS CloudWatch** | Monitoring Node thay Node Exporter |

> 💡 **Hội đồng hỏi:** *"Tại sao Worker Node nằm ở Private Subnet?"*
>
> **Trả lời:** Bảo mật — Node không bị expose trực tiếp ra Internet. Chỉ ALB ở Public Subnet nhận traffic rồi forward vào cluster.

### 📚 Kiến thức sử dụng
- AWS VPC, Subnet, Route Table, IGW, NAT Gateway
- Amazon EKS, eksctl, Node Group
- AWS Load Balancer Controller
- AWS IAM Role for Service Account (IRSA)
- AWS CloudWatch

### ✅ Kết quả đạt được
- Hạ tầng chạy trên AWS với kiến trúc production-ready
- Network phân lớp Public/Private đúng chuẩn bảo mật
- CI/CD tự động deploy lên EKS

---

## Giai đoạn 13 — Dashboard Production

### Grafana Data Source Configuration

Grafana kết nối **3 datasource** để hiển thị toàn bộ hệ thống trên một Dashboard duy nhất:

| Data Source | Dữ liệu cung cấp | Cấu hình |
|---|---|---|
| **Prometheus** | Application metrics, Kubernetes metrics | URL nội bộ Prometheus Service trong cluster |
| **CloudWatch** | EC2 Node metrics, EKS metrics (thay Node Exporter) | AWS IAM Role + `cloudwatch:GetMetricData` |
| **Loki** | Log từ toàn bộ Pod | URL nội bộ Loki Service trong cluster |

### Luồng dữ liệu

```
CloudWatch   ──▶  Grafana  (Dashboard 1 - Infrastructure)
Prometheus   ──▶  Grafana  (Dashboard 2,3 - K8s + Application)
AlertManager ──▶  Grafana  (Dashboard 4 - Alerting)
Loki         ──▶  Grafana  (Dashboard 4 - Logs)
GitHub Acts  ──▶  Grafana  (Dashboard 5 - CI/CD)
```

> ✅ Toàn bộ hệ thống được giám sát tại **một nơi duy nhất**.

---

## Giai đoạn 14 — AI Detection *(OPTIONAL)*

> Chỉ triển khai sau khi tất cả 13 giai đoạn trước hoàn tất và ổn định.
> Nếu AI chưa hoàn thiện, toàn bộ Infrastructure vẫn hoàn chỉnh và độc lập.

```
AI Detection Service → Docker Image → Deployment → Service
        │
Custom Metrics → Prometheus → Grafana
```

---

## Disaster Recovery

| Sự cố | Cơ chế | Thời gian phục hồi |
|---|---|---|
| Pod crash | livenessProbe → auto restart | ~15–30 giây |
| App treo (hang) | livenessProbe timeout → restart | ~30 giây |
| Pod chưa sẵn sàng | readinessProbe fail → không route traffic | 0 downtime |
| Node chết | Scheduler reschedule Pod sang Node khác | ~1–3 phút |
| Deploy thất bại | readinessProbe fail → dừng Rolling Update, giữ Pod cũ | 0 downtime |
| Version lỗi | `kubectl rollout undo` → rollback | ~30 giây |

> 💡 **Hội đồng hỏi:** *"Nếu Node chết thì sao? Hệ thống có downtime không?"*
>
> **Trả lời:** Không — Replica chạy trên nhiều Node. Kubernetes tự reschedule, Service tự cập nhật routing.

---

## Ma trận triển khai

| Giai đoạn | File / YAML sẽ tạo | Công cụ | Kết quả mong đợi |
|---|---|---|---|
| **Containerization** | `Dockerfile`, `docker-compose.yml` | Docker | Image build thành công, container chạy được |
| **Kubernetes Local** | `namespace.yaml`, `configmap.yaml`, `secret.yaml`, `deployment.yaml`, `service.yaml`, `ingress.yaml`, `rbac.yaml`, `networkpolicy.yaml` | kubectl, minikube | Ứng dụng chạy trên Minikube, truy cập qua Ingress |
| **Monitoring** | `prometheus-values.yaml`, `grafana-values.yaml`, `node-exporter.yaml`, `kube-state-metrics.yaml` | Helm | Thu thập và hiển thị metrics trên Dashboard |
| **Logging** | `fluent-bit-values.yaml`, `loki-values.yaml` | Helm | Log tập trung từ toàn bộ Pod, truy vấn được trên Grafana |
| **Alerting** | `alert-rules.yaml`, `alertmanager-config.yaml` | kubectl, Helm | Alert bắn đúng ngưỡng, thông báo Slack/Email |
| **Auto Scaling** | `hpa.yaml` | kubectl | Pod tự scale theo CPU |
| **Performance Test** | `load-test.js` | k6 | Xác minh HPA + Alert hoạt động dưới tải |
| **CI/CD** | `.github/workflows/deploy.yml` | GitHub Actions | Tự động build và deploy khi push code |
| **AWS** | `cluster.yaml`, `node-group.yaml`, `ingress-aws.yaml` | eksctl, kubectl | Hệ thống chạy trên Amazon EKS |

---

## Bảng công cụ tổng hợp

| Nhóm | Công cụ |
|---|---|
| Container | Docker |
| Orchestration | Kubernetes (Minikube → Amazon EKS) |
| CLI | kubectl, helm |
| Registry | AWS ECR |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Metrics Server, kube-state-metrics, Node Exporter |
| Logging | Fluent Bit, Loki |
| Alerting | AlertManager, Grafana Alerting |
| Dashboard | Grafana (5 Dashboard) |
| Application Metrics | Spring Boot Actuator + Micrometer |
| Cloud Metrics | AWS CloudWatch |
| Performance Test | k6 *(ưu tiên)*, JMeter |
| Database | MongoDB Atlas |
| Security | RBAC, Network Policy, cert-manager (TLS) |
| Service Discovery | Kubernetes CoreDNS (built-in) |
| Health Check | livenessProbe, readinessProbe, startupProbe |

---

---

# PHỤ LỤC

---

## Phụ lục A — Demo Scenarios

> **Dùng khi:** Chuẩn bị buổi bảo vệ đồ án.

---

### Demo 1 — Triển khai và kiểm tra hệ thống

**Kịch bản:** Deploy ứng dụng, xác nhận Dashboard hiển thị đúng.

```
kubectl apply -f k8s/
        │
Tất cả Pod → Running
        │
Grafana Dashboard → Metrics xuất hiện
        │
Truy cập Frontend → OK, Health Check OK
```

**Kết quả kỳ vọng:** Tất cả Pod Running, metrics hiển thị đúng.

---

### Demo 2 — Auto Scaling dưới tải

**Kịch bản:** Sinh tải → CPU tăng → HPA tự scale → Grafana + Alert realtime.

```
k6 run load-test.js (100 VU, 5 phút)
        │
CPU Backend > 80%
        │
HPA: Replica 1 → 3 → 5
        │
Grafana: CPU giảm, Replica tăng
AlertManager: Slack nhận CRITICAL alert
```

**Kết quả kỳ vọng:** Replica scale tự động, Alert bắn đúng.

---

### Demo 3 — Self-healing khi Pod chết

**Kịch bản:** Xóa Pod → Kubernetes tự tạo lại.

```
kubectl delete pod backend-xxx
        │
Deployment phát hiện thiếu Replica
        │
Pod mới tạo tự động (~15 giây)
        │
Grafana: Restart count tăng → Pod về Running
```

**Kết quả kỳ vọng:** Pod khôi phục, service không gián đoạn.

---

### Demo 4 — Zero-downtime Deployment

**Kịch bản:** Push code mới → CI/CD tự deploy → không downtime.

```
git push origin main
        │
GitHub Actions trigger
        │
Build Image v2 → Push ECR
        │
kubectl apply → Rolling Update
        │
Grafana CI/CD Dashboard: version cập nhật
Frontend hoạt động xuyên suốt
```

**Kết quả kỳ vọng:** Version mới deploy thành công, không lỗi, không gián đoạn.

---

### Demo 5 — Alerting System

**Kịch bản:** CPU vượt ngưỡng → Alert bắn → Slack + Dashboard.

```
k6 tạo tải cực cao
        │
CPU > 80% trong 5 phút
        │
AlertManager kích hoạt
        │
Slack: CRITICAL alert
Grafana Dashboard 4: Alert firing hiển thị
```

**Kết quả kỳ vọng:** Thông báo xuất hiện trong ~30 giây sau khi vượt ngưỡng.

---

## Phụ lục B — So sánh Local vs Production

> **Dùng khi:** Viết Chương 3 (Thiết kế hệ thống) trong báo cáo.

| Thành phần | Local | Production |
|---|---|---|
| **Kubernetes** | Minikube | Amazon EKS |
| **Registry** | Docker Local | AWS ECR |
| **Node Metrics** | Node Exporter | AWS CloudWatch Agent |
| **Ingress** | NGINX Ingress Controller | AWS Load Balancer Controller |
| **Load Balancer** | Minikube Tunnel | AWS ALB / NLB |
| **TLS** | Self-signed / cert-manager | cert-manager + Let's Encrypt |
| **Network** | Minikube internal | VPC + Public/Private Subnet |
| **Auto Scaling** | HPA (manual test) | HPA + EC2 Cluster Autoscaler |
| **Log Storage** | Loki (local) | Loki on EKS |
| **Database** | MongoDB Atlas | MongoDB Atlas *(không đổi)* |
| **Storage (PV/PVC)** | Không cần | Không cần *(không đổi)* |

> ✅ **Điểm mạnh:** Database và Storage **giống nhau** ở cả hai môi trường nhờ MongoDB Atlas — không có rủi ro khi migrate lên Cloud.

---

## Phụ lục C — Infrastructure Layers

> **Dùng khi:** Viết Chương 3 (Thiết kế hệ thống) trong báo cáo.

| Layer | Tên | Thành phần |
|---|---|---|
| Layer 1 | Container Platform | Docker, Dockerfile |
| Layer 2 | Kubernetes Platform | Namespace, ConfigMap, Secret, Deployment, Service, Ingress, RBAC, Network Policy, Health Check, Resource Management |
| Layer 3 | Observability — Metrics | Prometheus, Metrics Server, Node Exporter, kube-state-metrics, Spring Boot Actuator |
| Layer 4 | Observability — Logs | Fluent Bit, Loki, LogQL |
| Layer 5 | Alerting | AlertManager, Grafana Alerting, Alert Rules |
| Layer 6 | Visualization | Grafana (5 Dashboard) |
| Layer 7 | Automation | GitHub Actions, AWS ECR, Rolling Update |
| Layer 8 | Cloud Platform | VPC, EKS, ALB, CloudWatch, MongoDB Atlas |
| Layer 9 | Validation | k6/JMeter, Demo Scenarios, Disaster Recovery |

---

## Phụ lục D — Dashboard Design (5 Dashboard)

> **Dùng khi:** Viết Chương 4 (Triển khai) và chuẩn bị demo.

### Dashboard 1 — Infrastructure

**Datasource:** Node Exporter (Local) / CloudWatch (Production)

| Panel | Metric |
|---|---|
| CPU Usage (%) | Theo Node |
| RAM Usage (%) | Theo Node |
| Disk I/O | Tốc độ đọc/ghi |
| Filesystem Usage | Dung lượng còn trống |
| Network I/O | Băng thông vào/ra |

### Dashboard 2 — Kubernetes

**Datasource:** kube-state-metrics

| Panel | Metric |
|---|---|
| Pod Status | Running / Pending / Failed |
| Deployment Health | Desired vs Available |
| Replica Count | Theo Deployment |
| Restart Count | Số lần Pod restart |
| Namespace Overview | Tổng quan |
| Node Status | Ready / NotReady |

### Dashboard 3 — Application

**Datasource:** Spring Boot Actuator + Micrometer → Prometheus

| Panel | Metric |
|---|---|
| Request Rate | Requests/giây |
| Response Latency | p50 / p95 / p99 |
| HTTP Status | Tỉ lệ 2xx / 4xx / 5xx |
| JVM Heap | Bộ nhớ JVM |
| GC Activity | Tần suất và thời gian GC |

### Dashboard 4 — Alerting & Logs

**Datasource:** AlertManager + Loki

| Panel | Nội dung |
|---|---|
| Alert đang firing | Danh sách CRITICAL / WARNING hiện tại |
| Alert timeline | Lịch sử alert theo thời gian |
| Alert Rule status | Active / Pending / Inactive |
| Log stream | Log ERROR real-time từ Loki |

### Dashboard 5 — CI/CD

**Datasource:** GitHub Actions metrics / Deployment annotations

| Panel | Nội dung |
|---|---|
| Image version | Version đang chạy trên cluster |
| Deploy time | Thời điểm deploy gần nhất |
| Deploy status | Success / Failed |
| Rollback history | Các lần rollback nếu có |

---

## Phụ lục E — Monitoring Architecture

> **Dùng khi:** Viết Chương 4 (Monitoring & Observability) trong báo cáo.

### Bộ ba Observability

```
┌─────────────────────────────────────────────┐
│               OBSERVABILITY                 │
│                                             │
│  METRICS          LOGS           ALERTS     │
│  Prometheus  +   Loki      +  AlertManager  │
│       │              │               │      │
│       └──────────────┴───────────────┘      │
│                      │                      │
│                   GRAFANA                   │
│            (5 Dashboard tập trung)          │
└─────────────────────────────────────────────┘
```

### Luồng thu thập đầy đủ

```
[METRICS]
Node Exporter       → CPU/RAM/Disk/Network
kube-state-metrics  → Pod/Deployment/Namespace  ──▶ Prometheus ──▶ Grafana
Actuator            → Request/Latency/JVM                │
                                                    AlertManager
                                                    → Slack/Email
[LOGS]
Pod stdout → Fluent Bit (DaemonSet) ──▶ Loki ──▶ Grafana

[HPA INPUT]
Metrics Server → CPU real-time ──▶ HPA ──▶ Scale Deployment
```

### Tại sao chọn stack này thay vì ELK?

| Tiêu chí | ELK Stack | Prometheus + Loki + Grafana |
|---|---|---|
| Tài nguyên | Nặng (Elasticsearch cần RAM lớn) | Nhẹ, phù hợp cluster nhỏ/vừa |
| Tích hợp Kubernetes | Cần cấu hình phức tạp | Native Kubernetes |
| Dashboard | Kibana (riêng) + Grafana (riêng) | Grafana cho cả Metrics + Logs |
| Phù hợp đồ án | Overkill | ✅ Cân bằng chức năng và độ phức tạp |