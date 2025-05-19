// 🟢 ADD these imports at top
import React, { useEffect, useState } from 'react';
import {
    Modal, Box, TextField, Button, Typography as MuiTypography,
    BottomNavigation, BottomNavigationAction, Container, Paper, Table, TableBody, TableHead
} from '@mui/material';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import CustomBarChart from '../../components/CustomBarChart';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { StyledTableCell, StyledTableRow } from '../../components/styles';
import { useDispatch, useSelector } from 'react-redux';

const StudentSubjects = () => {
    const dispatch = useDispatch();
    const { subjectsList, sclassDetails } = useSelector((state) => state.sclass);
    const { userDetails, currentUser, loading } = useSelector((state) => state.user);

    const [subjectMarks, setSubjectMarks] = useState([]);
    const [selectedSection, setSelectedSection] = useState('table');

    const [openModal, setOpenModal] = useState(false); // assignment list modal
    const [uploadModalOpen, setUploadModalOpen] = useState(false); // upload solution modal

    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [assignmentResult, setAssignmentResult] = useState({ grade: '', score: '',question: '' });


    const [assignments, setAssignments] = useState([]);

    const [uploadData, setUploadData] = useState({
        name: '',
        subject: '',
        file: null
    });

    // Load user
    useEffect(() => {
        dispatch(getUserDetails(currentUser._id, "Student"));
    }, [dispatch, currentUser._id]);

    useEffect(() => {
        if (userDetails) {
            setSubjectMarks(userDetails.examResult || []);
        }
    }, [userDetails]);

    useEffect(() => {
        if (subjectMarks.length === 0) {
            dispatch(getSubjectList(currentUser.sclassName._id, "ClassSubjects"));
        }
    }, [subjectMarks, dispatch, currentUser.sclassName._id]);

    const handleSectionChange = (event, newSection) => {
        setSelectedSection(newSection);
    };

    const handleViewScore = async (assignment) => {
        try {
            const res = await fetch(`http://localhost:5001/api/students/getResult?subject=${selectedSubject?.subName}&question=${assignment?.question}&currentUser=${currentUser.name}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (res.ok) {
                setAssignmentResult({
                    grade: data.data.grade || 'N/A',
                    score: data.data.score || 'N/A',
                    question: data.data.question || 'N/A'
                });
                setResultModalOpen(true);
            } else {
                alert(data.message || "Failed to fetch result.");
            }
        } catch (error) {
            console.error("Error fetching result:", error);
            alert("Something went wrong while fetching the score.");
        }
    };


    const handleOpenModal = async (subject) => {
        setSelectedSubject(subject);
        try {
            const res = await fetch(`http://localhost:5001/api/teachers/getAssignmentsForStudents?subject=${encodeURIComponent(subject.subName)}`);
            const data = await res.json();
            setAssignments(data.result || []);
        } catch (error) {
            console.error("Failed to fetch assignments:", error);
            setAssignments([]);
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setAssignments([]);
    };

    // Upload Modal handlers
    const handleOpenUploadModal = (assignment) => {
        setSelectedAssignment(assignment);
        setUploadData({
            name: '',
            subject: selectedSubject.subName,
            file: null
        });
        setUploadModalOpen(true);
    };

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedAssignment(null);
        setUploadData({ name: '', subject: '', file: null });
    };

    // const handleInputChange = (e) => {
    //     const { name, value } = e.target;
    //     setUploadData({ ...uploadData, [name]: value });
    // };

    const handleFileChange = (e) => {
        setUploadData({ ...uploadData, file: e.target.files[0] });
    };

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('name', currentUser.name);
        formData.append('subject', uploadData.subject);
        formData.append('question', selectedAssignment?.question || '');
        formData.append('assignment', uploadData.file);

        try {
            const res = await fetch("http://localhost:5001/api/students/upload", {
                method: "POST",
                body: formData
            });


            if (res.ok) {
                alert("Solution uploaded successfully!");
                handleCloseUploadModal();
            } else if (res.status === 409) {
                alert("Assignment already uplaoded.");
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload error!");
        }
    };

    const renderClassDetailsSection = () => (
        <Container>
            <MuiTypography variant="h4" align="center" gutterBottom>
                Class Details
            </MuiTypography>
            <MuiTypography variant="h5" gutterBottom>
                You are currently in Class {sclassDetails?.sclassName}
            </MuiTypography>
            <MuiTypography variant="h6" gutterBottom>
                And these are the subjects:
            </MuiTypography>
            {subjectsList && subjectsList.map((subject, index) => (
                <div key={index} className='mb-4'>
                    <MuiTypography variant="subtitle1">
                        {subject.subName} ({subject.subCode})
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ ml: 2 }}
                            onClick={() => handleOpenModal(subject)}
                        >
                            View Assignments
                        </Button>
                    </MuiTypography>
                </div>
            ))}
        </Container>
    );

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {subjectMarks?.length > 0 ? (
                        <>
                            {selectedSection === 'table' && (
                                <>
                                    <MuiTypography variant="h4" align="center" gutterBottom>
                                        Subject Marks
                                    </MuiTypography>
                                    <Table>
                                        <TableHead>
                                            <StyledTableRow>
                                                <StyledTableCell>Subject</StyledTableCell>
                                                <StyledTableCell>Marks</StyledTableCell>
                                            </StyledTableRow>
                                        </TableHead>
                                        <TableBody>
                                            {subjectMarks.map((result, index) => (
                                                <StyledTableRow key={index}>
                                                    <StyledTableCell>{result.subName?.subName}</StyledTableCell>
                                                    <StyledTableCell>{result.marksObtained}</StyledTableCell>
                                                </StyledTableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                            {selectedSection === 'chart' && (
                                <CustomBarChart chartData={subjectMarks} dataKey="marksObtained" />
                            )}
                            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
                                <BottomNavigation value={selectedSection} onChange={handleSectionChange} showLabels>
                                    <BottomNavigationAction
                                        label="Table"
                                        value="table"
                                        icon={selectedSection === 'table' ? <TableChartIcon /> : <TableChartOutlinedIcon />}
                                    />
                                    <BottomNavigationAction
                                        label="Chart"
                                        value="chart"
                                        icon={selectedSection === 'chart' ? <InsertChartIcon /> : <InsertChartOutlinedIcon />}
                                    />
                                </BottomNavigation>
                            </Paper>
                        </>
                    ) : renderClassDetailsSection()}
                </div>
            )}

            {/* 📄 Assignment List Modal */}
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', width: 500,
                    bgcolor: 'background.paper', border: '2px solid #000',
                    boxShadow: 24, p: 4
                }}>
                    <MuiTypography variant="h6">
                        Assignments for {selectedSubject?.subName}
                    </MuiTypography>

                    {assignments.length === 0 ? (
                        <MuiTypography>No assignments found.</MuiTypography>
                    ) : (
                        assignments.map((a, idx) => (
                            <Box key={idx} sx={{ my: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                                <MuiTypography><strong>Name:</strong> {currentUser.name}</MuiTypography>
                                <MuiTypography><strong>Question:</strong> {a.question} </MuiTypography>
                                {a.live ? <span style={{ color: 'green' }}>(Open)</span> : <span style={{ color: 'red' }}>(Closed)</span>}
                                {a.live ? <Button
                                    variant="contained"
                                    size="small"
                                    sx={{ mt: 1 }}
                                    onClick={() => handleOpenUploadModal(a)}
                                >
                                    Upload Solution
                                </Button> :
                                    <Button
                                        variant="contained"
                                        size="small"
                                        sx={{ mt: 1 }}
                                        onClick={() => handleViewScore(a)}
                                    >
                                        View Score
                                    </Button>
                                }
                            </Box>
                        ))
                    )}
                </Box>
            </Modal>

            <Modal open={resultModalOpen} onClose={() => setResultModalOpen(false)}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', width: 400,
                    bgcolor: 'background.paper', border: '2px solid #000',
                    boxShadow: 24, p: 4
                }}>
                    <MuiTypography variant="h6">Assignment Result</MuiTypography>
                    <MuiTypography sx={{ mt: 2 }}>
                        <strong>Question:</strong> {assignmentResult.question}
                    </MuiTypography>
                    <MuiTypography sx={{ mt: 2 }}>
                        <strong>Grade:</strong> {assignmentResult.grade}
                    </MuiTypography>
                    <MuiTypography sx={{ mt: 1 }}>
                        <strong>Score:</strong> {assignmentResult.score}
                    </MuiTypography>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 3 }}
                        onClick={() => setResultModalOpen(false)}
                    >
                        Close
                    </Button>
                </Box>
            </Modal>

            {/* 📤 Upload Solution Modal */}
            <Modal open={uploadModalOpen} onClose={handleCloseUploadModal}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', width: 400,
                    bgcolor: 'background.paper', border: '2px solid #000',
                    boxShadow: 24, p: 4
                }}>
                    <MuiTypography variant="h6">Upload Solution</MuiTypography>
                    <MuiTypography variant="subtitle2" sx={{ mb: 1 }}>
                        <strong>Question:</strong> {selectedAssignment?.question}
                    </MuiTypography>
                    <TextField
                        fullWidth label="Your Name"
                        value={currentUser.name} disabled
                        margin="normal"
                    />
                    <TextField
                        fullWidth label="Subject" value={uploadData.subject}
                        margin="normal" disabled
                    />
                    <Button variant="outlined" component="label" fullWidth>
                        Upload File
                        <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                    <Box mt={2}>
                        <Button variant="contained" fullWidth onClick={handleUpload}>
                            Submit
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default StudentSubjects;
