import { useEffect, useState } from "react";
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getClassStudents } from "../../redux/sclassRelated/sclassHandle";
import {
    Paper, Box, Typography, ButtonGroup, Button, Popper, Grow,
    ClickAwayListener, MenuList, MenuItem, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl,
    InputLabel, Select, MenuItem as MuiMenuItem, CircularProgress
} from '@mui/material';
import { BlackButton, BlueButton } from "../../components/buttonStyles";
import TableTemplate from "../../components/TableTemplate";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

const TeacherClassDetails = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { sclassStudents, loading, error, getresponse } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);
    const classID = currentUser.teachSclass?._id;
    const subjectID = currentUser.teachSubject?._id;

    const [modalOpen, setModalOpen] = useState(false);
    const [assignmentsModalOpen, setAssignmentsModalOpen] = useState(false);
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(currentUser.teachSubject?.subName || "");
    const [questionText, setQuestionText] = useState("");
    const [solutionCode, setSolutionCode] = useState("");
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [grading, setGrading] = useState(false);

    useEffect(() => {
        dispatch(getClassStudents(classID));
    }, [dispatch, classID]);

    const fetchAssignments = async () => {
        const res = await fetch(`http://localhost:5001/api/teachers/get?subject=${selectedSubject}`);
        const data = await res.json();
        setAssignments(data.result);
    };

    const fetchSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        const res = await fetch(`http://localhost:5001/api/teachers/getAssignmentsForTeacher?subject=${assignment.subject}&question=${assignment.question}&classId=${classID}`);
        const data = await res.json();
        setSubmissions(data.students);
        setSubmissionModalOpen(true);
    };

    const handleAutoGrade = async () => {
        if (!selectedAssignment) return;
        setGrading(true);
        const res = await fetch(`http://localhost:5001/auto-grade?subject=${selectedAssignment.subject}&question=${selectedAssignment.question}`, {
            method: "POST"
        });
        const data = await res.json();
        alert(data.message || "Auto grading completed");
        setGrading(false);
    };

    const handlePublishAssignment = async () => {
        if (!questionText || !solutionCode) {
            alert("Please fill all fields");
            return;
        }

        const data = {
            subject: selectedSubject,
            question: questionText,
            solution: solutionCode,
        };

        try {
            const res = await fetch("http://localhost:5001/api/teachers/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                alert("Assignment published successfully!");
                setModalOpen(false);
                setQuestionText("");
                setSolutionCode("");
            } else {
                alert("Failed to publish assignment.");
            }
        } catch (err) {
            console.error(err);
            alert("Error uploading assignment.");
        }
    };

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
    ];

    const studentRows = sclassStudents.map((student) => ({
        name: student.name,
        rollNum: student.rollNum,
        id: student._id,
    }));

    const StudentsButtonHaver = ({ row }) => {
        const options = ['Take Attendance', 'Provide Marks'];
        const [open, setOpen] = useState(false);
        const anchorRef = React.useRef(null);
        const [selectedIndex, setSelectedIndex] = useState(0);

        const handleClick = () => {
            if (selectedIndex === 0) {
                navigate(`/Teacher/class/student/attendance/${row.id}/${subjectID}`);
            } else {
                navigate(`/Teacher/class/student/marks/${row.id}/${subjectID}`);
            }
        };

        const handleMenuItemClick = (event, index) => {
            setSelectedIndex(index);
            setOpen(false);
        };

        const handleToggle = () => {
            setOpen((prevOpen) => !prevOpen);
        };

        const handleClose = (event) => {
            if (anchorRef.current && anchorRef.current.contains(event.target)) return;
            setOpen(false);
        };

        return (
            <>
                <BlueButton variant="contained" onClick={() => navigate("/Teacher/class/student/" + row.id)}>
                    View
                </BlueButton>
                <ButtonGroup variant="contained" ref={anchorRef}>
                    <Button onClick={handleClick}>{options[selectedIndex]}</Button>
                    <BlackButton size="small" onClick={handleToggle}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </BlackButton>
                </ButtonGroup>
                <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
                    {({ TransitionProps, placement }) => (
                        <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
                            <Paper>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList autoFocusItem>
                                        {options.map((option, index) => (
                                            <MenuItem key={option} selected={index === selectedIndex} onClick={(event) => handleMenuItemClick(event, index)}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            </>
        );
    };

    return (
        <>
            <Typography variant="h4" align="center" gutterBottom>
                Class Details
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginBottom: '16px' }}>
                <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
                    Upload Assignment
                </Button>
                <Button variant="contained" color="secondary" onClick={() => { fetchAssignments(); setAssignmentsModalOpen(true); }}>
                    View Assignments
                </Button>
            </Box>

            {getresponse ? (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    No Students Found
                </Box>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <Typography variant="h5" gutterBottom>
                        Students List:
                    </Typography>

                    {Array.isArray(sclassStudents) && sclassStudents.length > 0 &&
                        <TableTemplate buttonHaver={StudentsButtonHaver} columns={studentColumns} rows={studentRows} />
                    }
                </Paper>
            )}

            {/* Upload Modal */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Assignment</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Subject</InputLabel>
                        <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} label="Subject">
                            <MuiMenuItem value={currentUser.teachSubject?.subName}>
                                {currentUser.teachSubject?.subName}
                            </MuiMenuItem>
                        </Select>
                    </FormControl>

                    <TextField fullWidth margin="normal" label="Assignment Question" multiline minRows={2} value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
                    <TextField fullWidth margin="normal" label="Solution Code" multiline minRows={5} value={solutionCode} onChange={(e) => setSolutionCode(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)} color="error">Cancel</Button>
                    <Button onClick={handlePublishAssignment} color="primary">Publish Assignment</Button>
                </DialogActions>
            </Dialog>

            {/* Assignments Modal */}
            <Dialog open={assignmentsModalOpen} onClose={() => setAssignmentsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assignments Uploaded</DialogTitle>
                <DialogContent>
                    {assignments.map((assn, idx) => (
                        <Box key={idx} sx={{ marginBottom: 2, padding: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                            <Typography><strong>Subject:</strong> {assn.subject}</Typography>
                            <Typography><strong>Question:</strong> {assn.question}</Typography>
                            <Button onClick={() => fetchSubmissions(assn)} sx={{ mt: 1 }}>View Submissions</Button>
                        </Box>
                    ))}
                </DialogContent>
            </Dialog>

            {/* Submissions Modal */}
            <Dialog open={submissionModalOpen} onClose={() => setSubmissionModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Student Submissions</DialogTitle>
                <DialogContent>
                    {submissions.map((sub, i) => (
                        <Typography key={i}>{sub.name} — {sub.submission ? '✅ Submitted' : '❌ Not Submitted'}</Typography>
                    ))}
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleAutoGrade}
                            disabled={grading || !assignments.live}
                        >
                            {assignments.live ? (
                                grading ? (
                                    <CircularProgress size={20} sx={{ color: 'white' }} />
                                ) : (
                                    'Auto Grade'
                                )
                            ) : (
                                'Already Graded'
                            )}
                        </Button>

                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TeacherClassDetails;
