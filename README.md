---
page_type: sample
products:
  - azure
  - azure-functions
  - azure-storage
languages:
  - javascript
  - nodejs
name: "Retrieve opened issue count on GitHub with Azure Durable Functions (Node)"
urlFragment: retrieve-opened-issue-count-on-github-with-azure-durable-functions
description: "Build an Azure Durable Functions sample that scrapes GitHub for opened issues, using Azure Durable Task Scheduler (DTS) as the orchestration backend."
extensions:
  ms.author: marouill
  ms.custom: nextgen
---

# Retrieve opened issue count on GitHub with Azure Durable Functions

## Build

The project requires the latest version of the [Azure Functions CLI](https://github.com/Azure/azure-functions-core-tools).

It can be installed by running the following code:

```bash
npm i -g azure-functions-core-tools@core --unsafe-perm true
```

More [installation options](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?WT.mc_id=durablejs-sample-marouill) are also available.

## Running the Sample

### Pre-requisite

- GitHub Personal Access Token
  - [How to create a Personal Access Token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
- [Azure Functions Core Tools v4](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?WT.mc_id=durablejs-sample-marouill)
- Node.js 20+
- [Docker](https://www.docker.com/) (for running the DTS emulator locally)
- [Azure Developer CLI (`azd`)](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd) (for deploying to Azure)
- [Visual Studio Code](https://code.visualstudio.com/download?WT.mc_id=durablejs-sample-marouill) (optional)
  - [Azure Functions Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) for debugging
- Azure Subscription (if running on Azure)
  - [Get a free Azure Trial Subscription](https://azure.microsoft.com/free/?WT.mc_id=durablejs-sample-marouill)

### Locally

This sample now uses **Azure Durable Task Scheduler (DTS)** as the orchestration backend. For local development, use the DTS emulator.

1. Start the DTS emulator (requires Docker):

   ```bash
   docker run -p 8080:8080 -p 8082:8082 mcr.microsoft.com/dts/dts-emulator:latest
   ```

   The emulator exposes the DTS endpoint on `http://localhost:8080` and a dashboard on `http://localhost:8082`.

2. Copy `FanOutFanInCrawler/local.settings.json.sample` to `FanOutFanInCrawler/local.settings.json` and set `GitHubToken` to your GitHub Personal Access Token. The sample file already points `DURABLE_TASK_SCHEDULER_CONNECTION_STRING` at the local emulator and sets `TASKHUB_NAME=default`.

3. Install dependencies and run the Function app:

   ```bash
   cd FanOutFanInCrawler
   npm install
   func start
   ```

4. Trigger the orchestration via the HTTP starter and watch the run reach `Completed` in the emulator dashboard at `http://localhost:8082`.

### On Azure

Deployment is handled by the [Azure Developer CLI (`azd`)](https://learn.microsoft.com/azure/developer/azure-developer-cli/). The `infra/` Bicep provisions a Flex Consumption Function app, a user-assigned managed identity, Log Analytics + Application Insights, a storage account (blob-only, for host state), and a `Microsoft.DurableTask/schedulers` resource with a task hub. The function app is granted the **Durable Task Data Contributor** role on the scheduler via the UAMI.

```bash
azd auth login
azd up
```

`azd up` will prompt for an environment name, target subscription, and Azure region (default `northcentralus`). After deploy, you can view orchestration runs in the DTS dashboard — find your scheduler endpoint with `azd show` and open `https://dashboard.durabletask.io`.

> Note: The `host.json` in this sample pins the standard `Microsoft.Azure.Functions.ExtensionBundle` (`[4.*, 5.0.0)`), which provides the `azureManaged` storage provider for the Durable Task Scheduler backend.

## Contribute

You can contribute to this sample by following [the guidelines](/CONTRIBUTE.md).

## Resources

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/?WT.mc_id=durablejs-sample-marouill)
- [Introduction to Azure Functions](https://docs.microsoft.com/azure/azure-functions/functions-overview?WT.mc_id=durablejs-sample-marouill)
- [Durable Functions overview](https://docs.microsoft.com/azure/azure-functions/durable-functions-overview?WT.mc_id=durablejs-sample-marouill)
- Durable Functions pattern used in this sample
  - [Chaining](https://docs.microsoft.com/azure/azure-functions/durable-functions-sequence?WT.mc_id=durablejs-sample-marouill)
  - [Fan-out/fan-in](https://docs.microsoft.com/azure/azure-functions/durable-functions-cloud-backup?WT.mc_id=durablejs-sample-marouill)
