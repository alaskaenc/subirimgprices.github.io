// script.js

// Configuración de GitHub
const GITHUB_TOKEN = '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';
const USERNAME = 'alaskaenc';
const REPO_NAME = 'codigos';
const JSON_PATH = 'prices.json'; // Ruta del archivo JSON

// Función principal para subir la imagen y actualizar el JSON
async function uploadImage() {
  const fileInput = document.getElementById('imageInput').files[0];
  const priceInput = document.getElementById('priceInput').value;

  if (!fileInput || !priceInput) {
    alert("Por favor, selecciona una imagen y escribe un precio o descripción.");
    return;
  }

  const base64Content = await readFileAsBase64(fileInput);

  try {
    // 1. Subir la imagen
    await uploadImageToGitHub(fileInput.name, base64Content);

    // 2. Actualizar el JSON
    await updateJsonFile(priceInput, fileInput.name);

    alert("Imagen y precio subidos correctamente.");
    
    // Limpiar campos de entrada
    document.getElementById('imageInput').value = ""; // Limpiar input de archivo
    document.getElementById('priceInput').value = ""; // Limpiar input de precio

  } catch (error) {
    alert(error.message);
  }
}

// Función para leer un archivo como base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}

// Función para subir la imagen al repositorio de GitHub
async function uploadImageToGitHub(imageName, base64Content) {
  const imagePath = `images/${imageName}`;
  const response = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${imagePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Subiendo nueva imagen",
      content: base64Content
    })
  });

  if (!response.ok) throw new Error("Error al subir la imagen");
}

// Función para actualizar el archivo JSON con la nueva imagen y precio
async function updateJsonFile(price, imageName) {
  // Obtener el contenido actual del JSON
  const jsonResponse = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${JSON_PATH}`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`
    }
  });
  const jsonData = await jsonResponse.json();
  const sha = jsonData.sha; // SHA necesario para actualizar el JSON
  const content = JSON.parse(atob(jsonData.content)); // Decodifica y convierte el JSON

  // Agregar o actualizar la entrada en el JSON
  content[imageName] = price; // Asignar el precio a la imagen

  // Codificar el JSON actualizado en base64
  const updatedContent = btoa(JSON.stringify(content));
  const updateResponse = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${JSON_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: "Actualizando JSON con nueva imagen y precio",
      content: updatedContent,
      sha: sha
    })
  });

  if (!updateResponse.ok) throw new Error("Error al actualizar el JSON");
}
