import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  Button,
  FormControlLabel,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getClassStudents } from '../../../redux/sclassRelated/sclassHandle';
import { toast } from 'react-toastify';
import axios from 'axios';

const MarkAllAttendance = ({ classId }) => {
  const dispatch = useDispatch();
  const { students, loading } = useSelector((state) => state.student);
  const [attendance, setAttendance] = useState({});

  // Fetch students for the given class
  useEffect(() => {
    if (classId) {
      dispatch(getClassStudents(classId));
    }
  }, [dispatch, classId]);

  // Initialize attendance state when students load
  useEffect(() => {
    if (students?.length > 0) {
      const initialAttendance = {};
      students.forEach((student) => {
        initialAttendance[student._id] = true; // default all present
      });
      setAttendance(initialAttendance);
    }
  }, [students]);

  const handleCheckboxChange = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSubmit = async () => {
    const attendanceList = students.map((student) => ({
      studentId: student._id,
      present: attendance[student._id],
    }));

    try {
      await axios.put(`${process.env.REACT_APP_BASE_URL}/attendance/mark-all`, {
        classId,
        attendance: attendanceList,
        date: new Date().toISOString(),
      });

      toast.success('Attendance marked successfully for all students!');
    } catch (error) {
      toast.error('Failed to mark attendance. Please try again.');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Mark Attendance for Class {classId}
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper elevation={3} style={{ padding: '16px' }}>
          {students.map((student) => (
            <FormControlLabel
              key={student._id}
              control={
                <Checkbox
                  checked={attendance[student._id] || false}
                  onChange={() => handleCheckboxChange(student._id)}
                />
              }
              label={`${student.firstName} ${student.lastName}`}
            />
          ))}

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Submit Attendance
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MarkAllAttendance;
