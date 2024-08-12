import { Connector, Media } from "@chili-publish/studio-connectors";

export default class MyConnector implements Media.MediaConnector {

  private runtime: Connector.ConnectorRuntimeContext;

  constructor(runtime: Connector.ConnectorRuntimeContext) {
    this.runtime = runtime;
  }

  async query(
    options: Connector.QueryOptions,
    context: Connector.Dictionary
  ): Promise<Media.MediaPage> {

    // Set a default user limit
    let limit = 30;

    // Check if a specific limit is provided in the settings (context)
    if (context.limit) {
      // Convert the provided limit to a number
      const parsedLimit = parseInt(context.limit.toString(), 10);

      // Validate and set the user limit between 1 and 100
      if (!isNaN(parsedLimit)) {
        limit = Math.min(Math.max(parsedLimit, 1), 100);
      }
    }


    const resp = await this.runtime.fetch(`https://${this.runtime.options["baseURL"]}/v2/list?page=1&limit=${limit}`, {
      method: "GET"
    });

    if (resp.ok) {
      const data = JSON.parse(resp.text);

      // Transform the data to match the Media type
      const dataFormatted = data.map(d => ({
        id: d.id,
        name: d.id,
        relativePath: "/",
        type: 0,
        metaData: {}
      })) as Array<any>;

      return {
        pageSize: options.pageSize, // Note: pageSize is not currently used by the UI
        data: dataFormatted,
        links: {
          nextPage: "" // Pagination is ignored in this example
        }
      }
    }

    // Handle error case
    throw new Error("Failed to fetch images from picsum.photos");
  }

  async detail(
    id: string,
    context: Connector.Dictionary
  ): Promise<Media.MediaDetail> {
    return {
      name: id,
      id: id,
      metaData: {},
      relativePath: "/",
      type: 0
    }
  }

  async download(
    id: string,
    previewType: Media.DownloadType,
    intent: Media.DownloadIntent,
    context: Connector.Dictionary
  ): Promise<Connector.ArrayBufferPointer> {

    // Check to see if we are a thumbnail in the UI or being used in another situation.
    switch (previewType) {
      case "thumbnail": {
        const picture = await this.runtime.fetch(`https://${this.runtime.options["baseURL"]}/id/${id}/${(context.wide) ? "400/" : ""}200`, { method: "GET" });
        return picture.arrayBuffer;
      }
      default: {
        const picture = await this.runtime.fetch(`https://${this.runtime.options["baseURL"]}/id/${id}/${(context.wide) ? "2000/" : ""}1000`, { method: "GET" });
        return picture.arrayBuffer;
      }
    }
  }

  getConfigurationOptions(): Connector.ConnectorConfigValue[] | null {
    return [
      {
        name: "limit",
        displayName: "Number (1 to 100) of Images to Display",
        type: "text"
      },
      {
        name: "wide",
        displayName: "Display images as rectangluar instead of square",
        type: "boolean"
      }
    ];
  }

  getCapabilities(): Media.MediaConnectorCapabilities {
    return {
      query: true,
      detail: true,
      filtering: true,
      metadata: false,
    };
  }
}
