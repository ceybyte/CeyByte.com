const APEX = "ceybyte.com";

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    url.hostname = APEX;
    url.protocol = "https:";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  },
} satisfies ExportedHandler;
