import Project from "../models/Project.js";
import AuditEvent from "../models/AuditEvent.js";
import { computeDiff } from "../utils/diff.util.js";
import { reconstructState } from "../utils/reconstruct.util.js";


export const createProject = async (req, res) => {
  try {
    const project = await Project.create({ data: req.body });

    await AuditEvent.create({
      entityType: "Project",
      entityId: project._id,
      action: "create",
      diff: computeDiff({}, req.body)
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const diff = computeDiff(project.data, req.body);

    if (Object.keys(diff).length === 0) {
      return res.status(400).json({
        message: "No changes detected"
      });
    }

    project.data = { ...project.data, ...req.body };
    await project.save();

    await AuditEvent.create({
      entityType: "Project",
      entityId: project._id,
      action: "update",
      diff
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await AuditEvent.create({
      entityType: "Project",
      entityId: req.params.id,
      action: "delete",
      diff: {}
    });

    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getHistory = async (req, res) => {
  try {
    const events = await AuditEvent
      .find({ entityId: req.params.id })
      .sort("timestamp");

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const reconstructAtTime = async (req, res) => {
  try {
    if (!req.query.time) {
      return res.status(400).json({ message: "Time query parameter is required" });
    }

    const time = new Date(req.query.time);

    const events = await AuditEvent.find({
      entityId: req.params.id,
      timestamp: { $lte: time }
    }).sort("timestamp");

    const state = reconstructState(events);
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const compareBetweenTimes = async (req, res) => {
  try {
    const { t1, t2 } = req.query;

    if (!t1 || !t2) {
      return res.status(400).json({
        message: "Both t1 and t2 query parameters are required"
      });
    }

    const endTime = new Date(t2);

    // Single query for consistency
    const events = await AuditEvent.find({
      entityId: req.params.id,
      timestamp: { $lte: endTime }
    }).sort("timestamp");

    const time1 = new Date(t1);

    const eventsAtT1 = events.filter(event => event.timestamp <= time1);
    const eventsAtT2 = events;

    res.json({
      stateAtT1: reconstructState(eventsAtT1),
      stateAtT2: reconstructState(eventsAtT2)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
