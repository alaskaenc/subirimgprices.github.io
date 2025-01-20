// Configuración de GitHub
const GITHUB_TOKEN = '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';
const USERNAME = 'alaskaenc';
const REPO_NAME = 'codigos';
const JSON_PATH = 'prices.json';

// Función para subir una imagen y un precio al JSON
document.getElementById('uploadButton').onclick = async function () {
    await handleImageUpload();
};

// Función para manejar la carga de la imagen
async function handleImageUpload() {
    const fileInput = document.getElementById('imageInput').files[0];
    const priceInput = document.getElementById('priceInput').value;

    if (!fileInput || !priceInput) {
        alert("Por favor, selecciona una imagen y escribe un precio o descripción.");
        return;
    }

    try {
        showProgressBar();

        const base64Content = await convertImageToPNG(fileInput);

        await uploadImageToGitHub(fileInput.name.replace(/\.[^/.]+$/, ".png"), base64Content);
        await updateJsonFile(priceInput, fileInput.name.replace(/\.[^/.]+$/, ".png"));

        alert("Imagen y precio subidos correctamente.");
        resetForm();

    } catch (error) {
        alert(getErrorMessage(error));
    } finally {
        hideProgressBar();
    }
}

// Función para convertir imagen a PNG en base64
async function convertImageToPNG(file) {
    const img = new Image();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = (event) => {
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const base64Image = canvas.toDataURL('image/png').split(',')[1];
                resolve(base64Image);
            };
            img.onerror = (error) => reject("Error al cargar la imagen: " + error);
        };
        reader.onerror = (error) => reject("Error al leer el archivo: " + error);
        reader.readAsDataURL(file);
    });
}

// Función para subir la imagen al repositorio de GitHub
async function uploadImageToGitHub(imageName, base64Content) {
    const imagePath = `images/${imageName}`;
    const url = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${imagePath}`;

    try {
        await axios.put(url, {
            message: "Subiendo nueva imagen",
            content: base64Content,
        }, {
            headers: createAuthHeaders(),
            onUploadProgress: updateProgressBar
        });
    } catch (error) {
        throw new Error("Error al subir la imagen: " + (error.response?.data?.message || error.message));
    }
}

// Función para actualizar el JSON con la imagen y el precio
async function updateJsonFile(price, imageName) {
    const url = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${JSON_PATH}`;

    try {
        const jsonResponse = await axios.get(url, { headers: createAuthHeaders() });
        const sha = jsonResponse.data.sha;
        const content = JSON.parse(atob(jsonResponse.data.content));

        content[imageName] = price;

        const updatedContent = btoa(JSON.stringify(content));
        await axios.put(url, {
            message: "Actualizando JSON",
            content: updatedContent,
            sha: sha
        }, {
            headers: createAuthHeaders()
        });
    } catch (error) {
        throw new Error("Error al actualizar el JSON: " + (error.response?.data?.message || error.message));
    }
}

// Función para buscar una imagen y su precio
document.getElementById('searchButton').onclick = async function () {
    const searchInput = document.getElementById('searchInput').value.trim();
    try {
        const jsonContent = await fetchJsonFile();

        const matchingKey = Object.keys(jsonContent).find(key =>
            key.startsWith(searchInput)
        );

        if (matchingKey) {
            document.getElementById('editSection').style.display = 'block';
            document.getElementById('imageName').textContent = `Editando precio para: ${matchingKey}`;
            document.getElementById('editPriceInput').value = jsonContent[matchingKey];

            showImagePreview(matchingKey);

            document.getElementById('updatePriceButton').onclick = async function () {
                await updateJsonFile(document.getElementById('editPriceInput').value, matchingKey);
                alert("Precio actualizado correctamente.");
                document.getElementById('editSection').style.display = 'none';
                document.getElementById('previewContainer').style.display = 'none';
            };
        } else {
            alert("Imagen no encontrada en el JSON. Verifica el nombre.");
            document.getElementById('previewContainer').style.display = 'none';
        }
    } catch (error) {
        alert("Error al buscar en el JSON: " + error.message);
    }
};

// Función para mostrar la vista previa de la imagen
function showImagePreview(imageName) {
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('previewContainer');
    const imageURL = `https://raw.githubusercontent.com/${USERNAME}/${REPO_NAME}/main/images/${imageName}`;

    imagePreview.src = imageURL;
    previewContainer.style.display = 'block';
}

// Función para obtener el contenido del JSON
async function fetchJsonFile() {
    const url = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents/${JSON_PATH}`;

    try {
        const response = await axios.get(url, { headers: createAuthHeaders() });
        return JSON.parse(atob(response.data.content));
    } catch (error) {
        throw new Error("Error al obtener el JSON: " + error.message);
    }
}

// Función para crear encabezados de autenticación
function createAuthHeaders() {
    return {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

// Mostrar barra de progreso
function updateProgressBar(event) {
    const percentCompleted = Math.round((event.loaded / event.total) * 100);
    document.getElementById('progressBar').style.width = `${percentCompleted}%`;
}

// Mostrar y ocultar barra de progreso
function showProgressBar() {
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = '0';
}

function hideProgressBar() {
    document.getElementById('progressContainer').style.display = 'none';
}

// Resetear formulario
function resetForm() {
    document.getElementById('imageInput').value = "";
    document.getElementById('priceInput').value = "";
    document.getElementById('imagePreview').src = "";
    document.getElementById('previewContainer').style.display = 'none';
}

function getErrorMessage(error) {
    if (error.response && error.response.data) {
        return error.response.data.message;
    }
    return error.message || "Error desconocido";
}
