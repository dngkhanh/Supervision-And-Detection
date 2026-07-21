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
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.31"
}

variable "fixed_node_count" {
  description = "Number of nodes in fixed pool"
  type        = number
}

variable "fixed_vm_size" {
  description = "VM size of fixed pool"
  type        = string
}

variable "scalable_vm_size" {
  description = "VM size of scalable pool"
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