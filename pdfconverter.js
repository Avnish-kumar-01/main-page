async function convertToPDF() {
  const fileInput = document.getElementById('fileToPdf');
  const files = fileInput.files;
  if (files.length === 0) {
    alert("Please upload at least one image!");
    return;
  }

  // Create a new PDF document
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageURL = URL.createObjectURL(file);

    // Load the image into an <img> element
    const img = new Image();
    img.src = imageURL;

    await new Promise((resolve) => {
      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        resolve();
      };
    });
  }

  // Save the PDF
  pdf.save('converted.pdf');
}

async function convertToImages() {
  const fileInput = document.getElementById('pdfToJpg');
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload a PDF!");
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = async function (event) {
    const typedArray = new Uint8Array(event.target.result);

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 }); // Adjust scale for higher resolution

      // Create a canvas to render the PDF page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert the canvas content to an image
      const imageData = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `page-${pageNum}.jpg`;
      link.click();
    }
  };

  fileReader.readAsArrayBuffer(file);
}
