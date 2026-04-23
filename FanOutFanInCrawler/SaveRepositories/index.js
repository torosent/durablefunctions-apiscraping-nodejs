// SaveRepositories activity — persists repo issue counts to Azure Table Storage.
//
// Cloud deployments use a managed identity (no shared keys) and set:
//   AzureWebJobsStorage__tableServiceUri  -> https://<account>.table.core.windows.net
//   AzureWebJobsStorage__credential       -> "managedidentity"
//   AzureWebJobsStorage__clientId         -> <user-assigned MI client id>
// Local dev sets `AzureWebJobsStorage` to a connection string (e.g. UseDevelopmentStorage=true)
// or `StorageConnectionString` for an explicit override.
const { TableClient } = require('@azure/data-tables');
const { DefaultAzureCredential } = require('@azure/identity');

function createTableClient(tableName) {
  const explicitConn = process.env.StorageConnectionString;
  if (explicitConn) {
    return TableClient.fromConnectionString(explicitConn, tableName);
  }

  const tableUri = process.env.AzureWebJobsStorage__tableServiceUri;
  if (tableUri) {
    const clientId = process.env.AzureWebJobsStorage__clientId;
    const credential = clientId
      ? new DefaultAzureCredential({ managedIdentityClientId: clientId })
      : new DefaultAzureCredential();
    return new TableClient(tableUri, tableName, credential);
  }

  const awjs = process.env.AzureWebJobsStorage;
  if (awjs) {
    return TableClient.fromConnectionString(awjs, tableName);
  }

  throw new Error(
    "No storage configured. Set 'AzureWebJobsStorage__tableServiceUri' (managed identity, cloud) " +
    "or 'AzureWebJobsStorage'/'StorageConnectionString' (connection string, local)."
  );
}

module.exports = async (context) => {
  const input = context.bindings.input;
  const tableClient = createTableClient('Repositories');

  await tableClient.createTable();

  // Table Storage transactional batches must share a partition key and stay <= 100 entities.
  const partitionKey = 'Default';
  for (let i = 0; i < input.length; i += 100) {
    const chunk = input.slice(i, i + 100);
    const actions = chunk.map((repo) => [
      'upsert',
      {
        partitionKey,
        rowKey: String(repo.id),
        OpenedIssues: repo.openedIssues,
        RepositoryName: repo.name,
      },
      'Merge',
    ]);
    if (actions.length > 0) {
      await tableClient.submitTransaction(actions);
    }
  }

  context.log(`Saved ${input.length} repositories to Table Storage.`);
};
