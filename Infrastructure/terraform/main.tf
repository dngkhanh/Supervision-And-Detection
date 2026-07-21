terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4.0"
    }
  }

  # Terraform state lưu trên Azure Blob Storage — cần tạo storage account trước:
  #   az group create -n rg-tfstate -l southeastasia
  #   az storage account create -n supervisiontfstate -g rg-tfstate --sku Standard_LRS
  #   az storage container create -n tfstate --account-name supervisiontfstate
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "supervisiontfstate"
    container_name       = "tfstate"
    key                  = "supervision-dev.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {

  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_container_registry" "acr" {

  name                = var.acr_name

  resource_group_name = azurerm_resource_group.main.name

  location            = azurerm_resource_group.main.location

  sku           = "Basic"

  admin_enabled = false
}

resource "azurerm_kubernetes_cluster" "aks" {

  name                = var.aks_name

  location            = azurerm_resource_group.main.location

  resource_group_name = azurerm_resource_group.main.name

  dns_prefix = var.dns_prefix

  kubernetes_version = var.kubernetes_version

  # Standard tier: SLA 99.95% cho control plane (Free tier không có SLA)
  sku_tier = "Standard"

  default_node_pool {

    name = "fixedpool"

    node_count = var.fixed_node_count

    vm_size = var.fixed_vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  # Azure CNI: bắt buộc để NetworkPolicy hoạt động đúng trên AKS
  network_profile {
    network_plugin = "azure"
    network_policy = "azure"   # hoặc "calico" nếu muốn dùng Calico
    load_balancer_sku = "standard"
  }
}

resource "azurerm_role_assignment" "acr_pull" {

  scope = azurerm_container_registry.acr.id

  role_definition_name = "AcrPull"

  principal_id = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}

resource "azurerm_kubernetes_cluster_node_pool" "scalable" {

  name = "scalepool"

  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks.id

  vm_size = var.scalable_vm_size

  enable_auto_scaling = true

  min_count = var.scalable_min_count

  max_count = var.scalable_max_count

  mode = "User"
}