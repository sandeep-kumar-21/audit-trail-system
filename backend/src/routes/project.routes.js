import express from "express";
import {
  createProject,
  updateProject,
  getHistory,
  reconstructAtTime,
  compareBetweenTimes
} from "../controllers/project.controller.js";

const router = express.Router();

router.post("/", createProject);
router.patch("/:id", updateProject);
router.get("/:id/history", getHistory);
router.get("/:id/reconstruct", reconstructAtTime);
router.get("/:id/compare", compareBetweenTimes);

export default router;
