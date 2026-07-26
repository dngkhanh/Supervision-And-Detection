terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4.0"
    }
  }

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
  tags     = var.common_tags
}

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = var.common_tags
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  sku_tier = "Free"

  default_node_pool {
    name       = "fixedpool"
    node_count = var.fixed_node_count
    vm_size    = var.fixed_vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  # Azure CNI: bắt buộc để NetworkPolicy hoạt động đúng trên AKS
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
  }

  tags = var.common_tags
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

  auto_scaling_enabled = true

  min_count = var.scalable_min_count

  max_count = var.scalable_max_count

  mode = "User"
}