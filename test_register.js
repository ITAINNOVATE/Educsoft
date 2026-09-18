const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function test() {
  try {
    const studentData = {
        firstName: "Glory",
        lastName: "ADJOHA",
        dob: "",
        pob: "",
        gender: "F",
        address: "",
        nationality: "Béninoise",
        birthCertNumber: "",
        bloodGroup: "",
        medicalInfo: "",
        handicap: "",
        adminObservations: "",
        internalNotes: ""
    };
    const enrollmentData = {
        classId: "some-class-id",
        schoolYearId: "some-school-year-id"
    };
    
    // Simulate what Prisma gets
    const data = {
        ...studentData,
        regNumber: "STU20260001",
        dob: studentData.dob ? new Date(studentData.dob) : new Date("2000-01-01"),
        pob: studentData.pob || "-",
        address: studentData.address || "-",
        status: studentData.status || "ACTIF",
        establishmentId: "some-estab-id"
    };
    console.log("Data:", data);
    
    // We cannot connect to DB, but we can see the data payload
  } catch(e) {
    console.error(e);
  }
}
test();
