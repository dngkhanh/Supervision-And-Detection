variable "resource_group_name" {
  description = "Resource Group Name"
  type        = string
}

variable "location" {
  description = "Azure Region"
  type        = string
}

variable "acr_name" {
  description = "Azure Container Registry Name"
  type        = string
}

variable "aks_name" {
  description = "AKS Cluster Name"
  type        = string
}

variable "dns_prefix" {
  description = "AKS DNS Prefix"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version for AKS cluster (null = Azure auto-select stable version)"
  type        = string
  default     = null
}

variable "fixed_node_count" {
  description = "Number of nodes in fixed pool"
  type        = number
}

variable "fixed_vm_size" {
  description = <<-EOT
    VM size of fixed pool. 
    Standard_B2s (2 vCPU, 4GB RAM): sufficient for monitoring stack + system pods.
    Upgrade to Standard_B2ms (2 vCPU, 8GB RAM) if planning to run databases in-cluster.
  EOT
  type        = string
}

variable "scalable_vm_size" {
  description = <<-EOT
    VM size of scalable pool.
    Standard_B2s (2 vCPU, 4GB RAM): OK for lightweight backend services.
    Standard_B2ms (2 vCPU, 8GB RAM): better for services with high memory usage.
  EOT
  type        = string
}

variable "scalable_min_count" {
  description = "Min nodes of scalable pool"
  type        = number
}

variable "scalable_max_count" {
  description = "Max nodes of scalable pool"
  type        = number
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {
    Environment = "Development"
    Project     = "Supervision"
    ManagedBy   = "Terraform"
  }
}