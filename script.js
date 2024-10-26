// Configuración de GitHub
const GITHUB_TOKEN = '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'; // Reemplaza con tu token
const USERNAME = 'alaskaenc';
const REPO_NAME = 'codigos';
const JSON_PATH = 'prices.json'; // Ruta del archivo JSON

// Función principal para subir la imagen y actualizar el JSON
document.getElementById('uploadButton').onclick = async function() {
    await uploadImage();
};

async function uploadImage() {
    const fileInput = document.getElementById('imageInput').files[0];
    const priceInput = document.getElementById('priceInput').value;

    if (!fileInput || !priceInput) {
        alert("Por favor, selecciona una imagen y escribe un precio o descripción.");
        return;
    }

    const base64Content = await readFileAsBase64(fileInput);

    try {
        // Mostrar la barra de carga
        document.getElementById('progressContainer').style.display = 'block';

        // 1. Subir la imagen
        await uploadImageToGitHub(fileInput.name, base64Content);

        // 2. Actualizar el JSON
        await updateJsonFile(priceInput, fileInput.name);

        alert("Imagen y precio subidos correctamente.");

        // Limpiar campos de entrada
        document.getElementById('imageInput').value = ""; // Limpiar input de archivo
        document.getElementById('priceInput').value = ""; // Limpiar input de precio
        document.getElementById('progressBar').style.width = '0'; // Reiniciar barra

    } catch (error) {
        // Mejor manejo de errores
        let errorMessage = "Error desconocido";
        if (error.response && error.response.data) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        alert(errorMessage);
    } finally {
        // Ocultar la barra de carga después de subir
        document.getElementById('progressContainer').style.display = 'none';
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
    try {
        await axios.put(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${imagePath}`, {
            message: "Subiendo nueva imagen",
            content: base64Content,
        }, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            onUploadProgress: progressEvent => {
                const total = progressEvent.total;
                const current = progressEvent.loaded;
                const percentCompleted = Math.round((current / total) * 100);
                document.getElementById('progressBar').style.width = percentCompleted + '%';
            }
        });
    } catch (error) {
        throw new Error("Error al subir la imagen: " + (error.response?.data?.message || error.message));
    }
}

// Función para actualizar el archivo JSON con la nueva imagen y precio
async function updateJsonFile(price, imageName) {
    try {
        // Obtener el contenido actual del JSON
        const jsonResponse = await axios.get(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${JSON_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
            }
        });

        const sha = jsonResponse.data.sha; // SHA necesario para actualizar el JSON
        const content = JSON.parse(atob(jsonResponse.data.content)); // Decodifica y convierte el JSON

        // Agregar o actualizar la entrada en el JSON
        content[imageName] = price; // Asignar el precio a la imagen

        // Codificar el JSON actualizado en base64
        const updatedContent = btoa(JSON.stringify(content));
        
        // Actualizar el archivo JSON
        await axios.put(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${JSON_PATH}`, {
            message: "Actualizando JSON con nueva imagen y precio",
            content: updatedContent,
            sha: sha, // Asegurarse de que el SHA se envíe
        }, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        throw new Error("Error al actualizar el JSON: " + (error.response?.data?.message || error.message));
    }
}
