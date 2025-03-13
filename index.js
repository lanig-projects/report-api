const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const port = 4321;

// Habilitar CORS para permitir todos los orígenes
app.use(cors());

// Configurar multer para manejar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/create-report", upload.single("file"), async (req, res) => {
    try {
        const { projectId, subject, description, discordWebhook } = req.body;
        const file = req.file;

        console.log(req.body);

        if (!projectId || !subject || !description) {
            return res.status(400).json({ error: "Todos los campos son requeridos.", req: JSON.stringify(req.body) });
        }

        // Paso 1: Autenticación
        const authResponse = await axios.post(
            "https://kanban.lanig.com.mx/api/v1/auth",
            {
                username: "mtz0mau2002@gmail.com",
                password: "12345678",
                type: "normal",
            }
        );
        const authToken = authResponse.data.auth_token;

        // Paso 2: Crear User Story
        const userStoryResponse = await axios.post(
            "https://kanban.lanig.com.mx/api/v1/userstories",
            {
                project: projectId,
                subject: subject,
                description: description,
                tags: [["fix", "#E44057"]],
            },
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        const storyId = userStoryResponse.data.id;

        let fileUrl = "";

        if (file) {
            // Paso 3: Subir archivo adjunto
            const formData = new FormData();
            formData.append("project", projectId);
            formData.append("object_id", storyId);
            formData.append("attached_file", file.buffer, file.originalname);

            const response = await axios.post(
                "https://kanban.lanig.com.mx/api/v1/userstories/attachments",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        ...formData.getHeaders(),
                    },
                }
            );

            fileUrl = response.data.url;
        }

        // post a discord
        await axios.post(discordWebhook, {
            content: `Se ha creado un nuevo reporte en el proyecto ${projectId}. ${subject} - ${description}. ${fileUrl}`,
        });

        res.json({ message: "Reporte creado exitosamente.", storyId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al procesar el reporte." });
    }
});

app.get("/api/userstories", async (req, res) => {
    try {
        const { projectId, status } = req.query;

        if (!projectId || !status) {
            return res.status(400).json({ error: "Los parámetros projectId y status son requeridos." });
        }

        // Autenticación
        const authResponse = await axios.post(
            "https://kanban.lanig.com.mx/api/v1/auth",
            {
                username: "mtz0mau2002@gmail.com",
                password: "12345678",
                type: "normal",
            }
        );
        const authToken = authResponse.data.auth_token;

        // Obtener historias de usuario
        const response = await axios.get(
            `https://kanban.lanig.com.mx/api/v1/userstories?project=${projectId}&status=${status}`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        const formattedStories = response.data?.map(story => {
            const tags = story.tags?.map(tag => tag[0]).join(" - ");
            const epics = story.epics?.map(epic => epic.subject).join(" - ");
            return `${story.subject} - ${tags} - ${epics}`;
        });

        res.json(formattedStories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener las historias de usuario." });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});