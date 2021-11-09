interface GalleryResponse {
  total: number;
  objects: Array<string>;
}

interface QueryParameters {
  limit?: string;
  page?: number | string | undefined;
  filter?: string;
}

export { GalleryResponse, QueryParameters };
