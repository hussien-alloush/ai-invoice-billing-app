const express = require("express");
const { z } = require("zod");

const asyncHandler = require("../middleware/asyncHandler");
const requireAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const settings = require("../models/setting");

const router = express.Router();
router.use(requireAuth);

const settingSchema = z.object({
    company_name: z.string().trim().max(120).optional(),
    logo_url: z.string().trim().max(500_000).optional(),
    address: z.string().trim().max(400).optional(),
    email: z.union([
        z.string().trim().max(160).email(),
        z.literal(""),
    ]).optional(),
    phone: z.string().trim().max(30).optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    invoice_prefix: z.string().trim().max(20).optional(),
    accent_color: z.string().trim().max(20).optional(),
});

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const setting = await settings.ensure(req.user.id);
        res.json({ settings: setting });
    })
);

router.patch(
    "/",
    validate(settingSchema),
    asyncHandler(async (req, res) => {
        const setting = await settings.update(req.user.id, req.body);
        res.json({ settings: setting });
    })
);

module.exports = router;
