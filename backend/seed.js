const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');
const Otp = require('./models/Otp');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_attendance';
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await User.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Subject.deleteMany();
    await Attendance.deleteMany();
    await ActivityLog.deleteMany();
    await Notification.deleteMany();
    await Otp.deleteMany();

    console.log('Creating Admin account...');
    const adminUser = await User.create({
      name: 'Dr. Rajesh Verma (Principal & Admin)',
      email: 'admin@smartattendance.edu',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    });

    console.log('Creating Teacher accounts...');
    const teacherUser1 = await User.create({
      name: 'Prof. Ananya Sharma',
      email: 'teacher.sharma@smartattendance.edu',
      password: 'Teacher@123',
      role: 'teacher',
      isVerified: true,
      phone: '+91 98765 11111',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    });

    const teacherUser2 = await User.create({
      name: 'Dr. Vikram Patel',
      email: 'teacher.patel@smartattendance.edu',
      password: 'Teacher@123',
      role: 'teacher',
      isVerified: true,
      phone: '+91 98765 22222',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    });

    const teacher1 = await Teacher.create({
      user: teacherUser1._id,
      employeeId: 'EMP-T101',
      department: 'Computer Science',
      designation: 'Associate Professor',
      qualification: 'Ph.D in Computer Science',
      assignedSubjects: [],
    });

    const teacher2 = await Teacher.create({
      user: teacherUser2._id,
      employeeId: 'EMP-T102',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      qualification: 'M.Tech in Software Engineering',
      assignedSubjects: [],
    });

    console.log('Creating Subjects...');
    const subject1 = await Subject.create({
      name: 'Data Structures & Algorithms',
      code: 'CS501',
      department: 'Computer Science',
      semester: 5,
      credits: 4,
      teacher: teacher1._id,
    });

    const subject2 = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS502',
      department: 'Computer Science',
      semester: 5,
      credits: 4,
      teacher: teacher1._id,
    });

    const subject3 = await Subject.create({
      name: 'Full Stack Web Development',
      code: 'CS503',
      department: 'Computer Science',
      semester: 5,
      credits: 3,
      teacher: teacher2._id,
    });

    const subject4 = await Subject.create({
      name: 'Computer Networks',
      code: 'CS504',
      department: 'Computer Science',
      semester: 5,
      credits: 3,
      teacher: teacher2._id,
    });

    const subject5 = await Subject.create({
      name: 'Artificial Intelligence & ML',
      code: 'CS505',
      department: 'Computer Science',
      semester: 5,
      credits: 3,
      teacher: teacher1._id,
    });

    // Update teachers with their assigned subjects
    await Teacher.findByIdAndUpdate(teacher1._id, {
      assignedSubjects: [subject1._id, subject2._id, subject5._id],
    });
    await Teacher.findByIdAndUpdate(teacher2._id, {
      assignedSubjects: [subject3._id, subject4._id],
    });

    console.log('Creating Students...');
    const studentNames = [
      { name: 'Aarav Mehta', email: 'student.aarav@smartattendance.edu', roll: 'STD-1001', gender: 'm' },
      { name: 'Priya Iyer', email: 'student.priya@smartattendance.edu', roll: 'STD-1002', gender: 'f' },
      { name: 'Rohan Gupta', email: 'student.rohan@smartattendance.edu', roll: 'STD-1003', gender: 'm' },
      { name: 'Sneha Rao', email: 'student.sneha@smartattendance.edu', roll: 'STD-1004', gender: 'f' },
      { name: 'Kavya Nair', email: 'student.kavya@smartattendance.edu', roll: 'STD-1005', gender: 'f' },
      { name: 'Aditya Singh', email: 'student.aditya@smartattendance.edu', roll: 'STD-1006', gender: 'm' },
      { name: 'Neha Joshi', email: 'student.neha@smartattendance.edu', roll: 'STD-1007', gender: 'f' },
      { name: 'Manish Verma', email: 'student.manish@smartattendance.edu', roll: 'STD-1008', gender: 'm' },
      { name: 'Tanvi Deshmukh', email: 'student.tanvi@smartattendance.edu', roll: 'STD-1009', gender: 'f' },
      { name: 'Karan Malhotra', email: 'student.karan@smartattendance.edu', roll: 'STD-1010', gender: 'm' },
    ];

    const studentDocs = [];

    for (let i = 0; i < studentNames.length; i++) {
      const s = studentNames[i];
      const avatarUrl =
        s.gender === 'm'
          ? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80`
          : `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80`;

      const user = await User.create({
        name: s.name,
        email: s.email,
        password: 'Student@123',
        role: 'student',
        isVerified: true,
        phone: `+91 98765 ${30000 + i}`,
        avatar: avatarUrl,
      });

      const student = await Student.create({
        user: user._id,
        rollNumber: s.roll,
        department: 'Computer Science',
        semester: 5,
        section: 'A',
        batch: '2023-2027',
        guardianContact: `+91 98111 ${40000 + i}`,
      });

      studentDocs.push(student);
    }

    console.log('Generating realistic 14-day attendance history...');
    const subjectsList = [subject1, subject2, subject3, subject4, subject5];
    const today = new Date();

    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const recordDate = new Date(today);
      recordDate.setDate(recordDate.getDate() - dayOffset);
      recordDate.setHours(0, 0, 0, 0);

      // Skip Sundays
      if (recordDate.getDay() === 0) continue;

      for (const subj of subjectsList) {
        for (const stud of studentDocs) {
          // 85% probability present, 10% absent, 5% late
          const rand = Math.random();
          let status = 'Present';
          if (rand > 0.90) status = 'Absent';
          else if (rand > 0.83) status = 'Late';

          const markMethod = rand > 0.4 ? 'Manual' : 'QR';

          await Attendance.create({
            date: recordDate,
            subject: subj._id,
            student: stud._id,
            markedBy: subj.teacher ? subj.teacher.user || adminUser._id : adminUser._id,
            status,
            method: markMethod,
            remarks: status === 'Late' ? 'Late arrival 10 mins' : '',
          });
        }
      }
    }

    console.log('Creating initial activity logs and notifications...');
    await ActivityLog.create({
      user: adminUser._id,
      action: 'SYSTEM_INITIALIZED',
      details: 'System seeded with full demo dataset (Teachers, Students, Subjects, History)',
    });

    for (const stud of studentDocs) {
      await Notification.create({
        recipient: stud.user,
        title: 'Welcome to Smart Attendance',
        message: 'Your student account is active. Check your attendance records and schedule in your dashboard.',
        type: 'info',
      });
    }

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Demo Credentials for Instant Testing:');
    console.log('------------------------------------------------------');
    console.log('🔑 ADMIN:');
    console.log('   Email:    admin@smartattendance.edu');
    console.log('   Password: Admin@123\n');
    console.log('🔑 TEACHER (Prof. Sharma):');
    console.log('   Email:    teacher.sharma@smartattendance.edu');
    console.log('   Password: Teacher@123\n');
    console.log('🔑 STUDENT (Aarav Mehta):');
    console.log('   Email:    student.aarav@smartattendance.edu');
    console.log('   Password: Student@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  }
};

seedData();
