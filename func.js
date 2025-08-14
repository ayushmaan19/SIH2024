// var button = document.getElementById("button");
// button.addEventListener("click", function () {
//   alert("hi there");
// });
function uploadPDF() {
     
      const pdfInput = document.getElementById('pdfUpload');
      const file = pdfInput.files[0];


      if (file && file.type === 'application/pdf') {
        alert("PDF file uploaded: " + file.name);


      } else {
        alert("Please upload a valid PDF file.");
      }
    }
