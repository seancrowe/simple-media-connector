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

    // When pageSize is 1 & collection is null, we know that query is called before download
    if (options.pageSize == 1 && !options.collection) {
      return {
        pageSize: options.pageSize, // Note: pageSize is not currently used by the UI

        data: [{

          id: options.filter[0],
          name: "",
          relativePath: "",
          type: 0,
          metaData: {}
        }],

        links: {
          nextPage: "" // Pagination is ignored in this example
        }
      }
    }

    // If pageSize is bigger than 1, we do a normal query

    const resp = await this.runtime.fetch("https://picsum.photos/v2/list?page=1", {
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
        const picture = await this.runtime.fetch(`https://picsum.photos/id/${id}/200`, { method: "GET" });
        return picture.arrayBuffer;
      }
      default: {
        const picture = await this.runtime.fetch(`https://picsum.photos/id/${id}/1000`, { method: "GET" });
        return picture.arrayBuffer;
      }
    }
  }

  getConfigurationOptions(): Connector.ConnectorConfigValue[] | null {
    return [];
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
