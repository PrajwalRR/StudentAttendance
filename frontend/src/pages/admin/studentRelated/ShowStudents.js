import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { getAllStudents } from '../../../redux/studentRelated/studentHandle';
import {
    Paper, Box, IconButton, Button, ButtonGroup, MenuItem, MenuList, Popper,
    Grow, ClickAwayListener, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, Typography
} from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { BlackButton, BlueButton, GreenButton } from '../../../components/buttonStyles';
import TableTemplate from '../../../components/TableTemplate';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import Popup from '../../../components/Popup';
import { toast } from 'react-toastify';
import axios from 'axios';

const ShowStudents = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { studentsList, loading } = useSelector((state) => state.student);
    const { currentUser } = useSelector(state => state.user);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [attendance, setAttendance] = useState({});

    useEffect(() => {
        dispatch(getAllStudents(currentUser._id));
    }, [currentUser._id, dispatch]);

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/AllSubjects/${currentUser._id}`);
            setSubjects(res.data);
        } catch (error) {
            toast.error("Failed to load subjects");
        }
    };

    const handleOpenModal = () => {
        fetchSubjects();
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setAttendance({});
        setSelectedSubject('');
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleAttendanceSubmit = async () => {
        if (!selectedSubject) {
            toast.error("Please select a subject");
            return;
        }

        const date = new Date().toISOString();
        try {
            const promises = Object.entries(attendance).map(([studentId, status]) =>
                axios.put(`${process.env.REACT_APP_BASE_URL}/StudentAttendance/${studentId}`, {
                    subName: selectedSubject,
                    status,
                    date,
                })
            );
            await Promise.all(promises);
            toast.success("Attendance marked successfully!");
            handleCloseModal();
        } catch (error) {
            toast.error("Failed to mark attendance.");
        }
    };

    const deleteHandler = (deleteID, address) => {
        setMessage("Sorry the delete function has been disabled for now.");
        setShowPopup(true);
    };

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
        { id: 'sclassName', label: 'Class', minWidth: 170 },
    ];

    const studentRows = Array.isArray(studentsList) && studentsList.map((student) => ({
        name: student.name,
        rollNum: student.rollNum,
        sclassName: student.sclassName?.sclassName,
        id: student._id,
    }));

    const StudentButtonHaver = ({ row }) => {
        const options = ['Take Attendance', 'Provide Marks'];
        const [open, setOpen] = useState(false);
        const anchorRef = useRef(null);
        const [selectedIndex, setSelectedIndex] = useState(0);

        const handleClick = () => {
            if (selectedIndex === 0) {
                navigate("/Admin/students/student/attendance/" + row.id);
            } else if (selectedIndex === 1) {
                navigate("/Admin/students/student/marks/" + row.id);
            }
        };

        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Student")}>
                    <PersonRemoveIcon color="error" />
                </IconButton>
                <BlueButton variant="contained" onClick={() => navigate("/Admin/students/student/" + row.id)}>
                    View
                </BlueButton>
                <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                    <Button onClick={handleClick}>{options[selectedIndex]}</Button>
                    <BlackButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </BlackButton>
                </ButtonGroup>
                <Popper open={open} anchorEl={anchorRef.current} transition>
                    {({ TransitionProps }) => (
                        <Grow {...TransitionProps}>
                            <Paper>
                                <ClickAwayListener onClickAway={() => setOpen(false)}>
                                    <MenuList autoFocusItem>
                                        {options.map((option, index) => (
                                            <MenuItem
                                                key={option}
                                                selected={index === selectedIndex}
                                                onClick={(event) => {
                                                    setSelectedIndex(index);
                                                    setOpen(false);
                                                }}
                                            >
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

    const actions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: 'Add New Student',
            action: () => navigate("/Admin/addstudents")
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: 'Delete All Students',
            action: () => deleteHandler(currentUser._id, "Students")
        },
    ];

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                        <GreenButton variant="contained" onClick={() => navigate("/Admin/addstudents")}>
                            Add Students
                        </GreenButton>
                        <GreenButton variant="contained" onClick={handleOpenModal}>
                            Mark Attendance for All
                        </GreenButton>
                    </Box>

                    <Paper sx={{ width: '100%', overflow: 'hidden', marginTop: '16px' }}>
                        {Array.isArray(studentsList) && studentsList.length > 0 && (
                            <TableTemplate buttonHaver={StudentButtonHaver} columns={studentColumns} rows={studentRows} />
                        )}
                        <SpeedDialTemplate actions={actions} />
                    </Paper>

                    <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                        <DialogTitle>Mark Attendance</DialogTitle>
                        <DialogContent>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Select Subject</InputLabel>
                                <Select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                >
                                    {subjects.map((subject) => (
                                        <MenuItem key={subject._id} value={subject._id}>
                                            {subject.subName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box mt={2}>
                                {studentsList.map((student) => (
                                    <Box key={student._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography>{student.name} ({student.rollNum})</Typography>
                                        <FormControl sx={{ minWidth: 120 }}>
                                            <Select
                                                value={attendance[student._id] || ''}
                                                onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="">Select</MenuItem>
                                                <MenuItem value="Present">Present</MenuItem>
                                                <MenuItem value="Absent">Absent</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                ))}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseModal}>Cancel</Button>
                            <GreenButton onClick={handleAttendanceSubmit}>Submit Attendance</GreenButton>
                        </DialogActions>
                    </Dialog>
                </>
            )}
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default ShowStudents;
