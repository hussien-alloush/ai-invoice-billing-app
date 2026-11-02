const multer = require("multer");
const APIError = require("../utils/ApiError");

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ACCEPTED = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/heic",
    "image/heif",
]);

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: MAX_BYTES,
        files: 1,
    },

    fileFilter: (req, file, cb) => {
        if (!ACCEPTED.has(file.mimetype)) {
            return cb(
                APIError.badRequest(
                    "Upload a PDF or image (PNG/JPG/WEBP/HEIC/HEIF)"
                )
            );
        }

        cb(null, true);
    },
});

const uploadReceipt = (field = "file") => (req, res, next) => {
    upload.single(field)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(
                    APIError.badRequest("File exceeds 10MB limit")
                );
            }

            return next(APIError.badRequest(err.message));
        }

        if (err) return next(err);

        if (!req.file) {
            return next(APIError.badRequest("No file uploaded"));
        }

        next();
    });
};

module.exports = { uploadReceipt };