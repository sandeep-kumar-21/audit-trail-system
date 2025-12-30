import Project from "../models/Project.js";
import AuditEvent from "../models/AuditEvent.js";
import { computeDiff } from "../utils/diff.util.js";
import { reconstructState } from "../utils/reconstruct.util.js";

/* CREATE */
export const createProject = async (req, res) => {
  try {
    const project = await Project.create({ data: req.body });

    await AuditEvent.create({
      entityType: "Project",
      entityId: project._id,
      action: "create",
      diff: computeDiff({}, req.body),
      timestamp: new Date()
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE */
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const diff = computeDiff(project.data, req.body);

    if (Object.keys(diff).length === 0) {
      return res.status(400).json({ message: "No changes detected" });
    }

    project.data = { ...project.data, ...req.body };
    await project.save();

    await AuditEvent.create({
      entityType: "Project",
      entityId: project._id,
      action: "update",
      diff,
      timestamp: new Date()
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* HISTORY */
export const getHistory = async (req, res) => {
  try {
    const events = await AuditEvent.find({
      entityId: req.params.id
    }).sort({ timestamp: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* RECONSTRUCT AT TIME */
export const reconstructAtTime = async (req, res) => {
  try {
    const { time } = req.query;
    if (!time) {
      return res.status(400).json({ message: "Time query parameter is required" });
    }

    const events = await AuditEvent.find({
      entityId: req.params.id,
      timestamp: { $lte: new Date(time) }
    }).sort({ timestamp: 1 });

    const state = reconstructState(events);
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* COMPARE BETWEEN TIMES */
export const compareBetweenTimes = async (req, res) => {
  try {
    const { t1, t2 } = req.query;

    if (!t1 || !t2) {
      return res.status(400).json({
        message: "Both t1 and t2 query parameters are required"
      });
    }

    const time1 = new Date(t1);
    const time2 = new Date(t2);

    const end = time1 < time2 ? time2 : time1;

    const events = await AuditEvent.find({
      entityId: req.params.id,
      timestamp: { $lte: end }
    }).sort({ timestamp: 1 });

    const eventsAtT1 = events.filter(e => e.timestamp <= time1);
    const eventsAtT2 = events.filter(e => e.timestamp <= time2);

    res.json({
      stateAtT1: reconstructState(eventsAtT1),
      stateAtT2: reconstructState(eventsAtT2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};