import axios from 'axios';


// Service for student-related API calls
const StudentService = {
  // Get all students in a class
  getClassStudents: async (sclassId) => {
    try {
      const result = await axios.get(`${import.meta.env.VITE_BASE_URL}/Sclass/Students/${sclassId}`);
      return result.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get all subjects for a class
  getSubjectList: async (sclassId) => {
    try {
      const result = await axios.get(`${import.meta.env.VITE_BASE_URL}/Sclass/ClassSubjects/${sclassId}`);
      return result.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  // Submit attendance for multiple students
  submitBulkAttendance: async (
    sclassId,
    subjectId,
    date,
    attendanceRecords,
  ) => {
    try {
      const result = await axios.post(`${import.meta.env.VITE_BASE_URL}/attendance/bulk`, {
        sclassId,
        subjectId,
        date,
        attendanceRecords
      });
      return result.data;
    } catch (error) {
      console.error('Error submitting attendance:', error);
      throw error;
    }
  }
};

export default StudentService;