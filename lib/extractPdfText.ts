export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjs.getDocument({
    data: arrayBuffer,
  }).promise;

  let text = "";

  for (let page = 1; page <= pdf.numPages; page++) {
    const p = await pdf.getPage(page);

    const content = await p.getTextContent();

    text +=
      content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }

  return text;
}