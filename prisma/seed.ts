import { db } from '../src/lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Seed Statuses
  const statuses = ['Active', 'Archived', 'Borrowed'];
  for (const name of statuses) {
    await db.status.upsert({
      where: { statusName: name },
      update: {},
      create: { statusName: name },
    });
  }
  console.log('✅ Statuses seeded');

  // Seed Categories
  const categories = ['PP', 'C.O.R', 'Invoice', 'Shipment', 'P.O.R', 'Q.P', 'Stability', 'Complaint', 'Return'];
  for (const name of categories) {
    await db.category.upsert({
      where: { categoryName: name },
      update: {},
      create: { categoryName: name },
    });
  }
  console.log('✅ Categories seeded');

  // Seed Suppliers
  const suppliers = ['Merck Serono', 'Julphar', 'Pfizer', 'Sanofi', 'GSK', 'Novartis', 'Roche', 'AstraZeneca'];
  for (const name of suppliers) {
    await db.supplier.upsert({
      where: { supplierName: name },
      update: {},
      create: { supplierName: name },
    });
  }
  console.log('✅ Suppliers seeded');

  // Seed Rooms
  const rooms = ['A', 'B', 'C', 'D'];
  for (const name of rooms) {
    await db.room.upsert({
      where: { roomName: name },
      update: {},
      create: { roomName: name },
    });
  }
  console.log('✅ Rooms seeded');

  // Seed Archive Files
  const existingFiles = await db.archiveFile.findMany();
  if (existingFiles.length === 0) {
    const archiveFiles = [
      {
        fileCode: 'SDF-001',
        title: 'Confirmation of Receipt - Merck Serono Q1',
        supplier: 'Merck Serono',
        category: 'C.O.R',
        room: 'A',
        boxNumber: '1',
        status: 'Archived',
      },
      {
        fileCode: 'SDF-002',
        title: 'Preparation of Receipt - Julphar',
        supplier: 'Julphar',
        category: 'P.O.R',
        room: 'A',
        boxNumber: '1',
        status: 'Active',
      },
      {
        fileCode: 'SDF-003',
        title: 'Product Profile - Pfizer Batch 2024',
        supplier: 'Pfizer',
        category: 'PP',
        room: 'B',
        rack: 'R1',
        shelf: 'S2',
        boxNumber: '3',
        status: 'Active',
      },
      {
        fileCode: 'SDF-004',
        title: 'Invoice #INV-2024-001',
        supplier: 'Sanofi',
        category: 'Invoice',
        room: 'A',
        boxNumber: '2',
        status: 'Active',
      },
      {
        fileCode: 'SDF-005',
        title: 'Shipment Record - GSK March 2024',
        supplier: 'GSK',
        category: 'Shipment',
        room: 'C',
        rack: 'R2',
        shelf: 'S1',
        boxNumber: '5',
        status: 'Borrowed',
        notes: 'Borrowed by Quality Dept.',
      },
      {
        fileCode: 'SDF-006',
        title: 'Stability Study Report - Novartis',
        supplier: 'Novartis',
        category: 'Stability',
        room: 'B',
        rack: 'R1',
        shelf: 'S3',
        boxNumber: '2',
        status: 'Active',
      },
      {
        fileCode: 'SDF-007',
        title: 'Customer Complaint #CC-2024-015',
        supplier: 'Roche',
        category: 'Complaint',
        room: 'D',
        boxNumber: '1',
        status: 'Active',
        notes: 'Under investigation',
      },
      {
        fileCode: 'SDF-008',
        title: 'Quality Protocol - AstraZeneca',
        supplier: 'AstraZeneca',
        category: 'Q.P',
        room: 'C',
        rack: 'R3',
        shelf: 'S1',
        boxNumber: '4',
        status: 'Archived',
      },
      {
        fileCode: 'SDF-009',
        title: 'Return Authorization - Julphar Batch RJ-22',
        supplier: 'Julphar',
        category: 'Return',
        room: 'A',
        boxNumber: '3',
        status: 'Active',
      },
      {
        fileCode: 'SDF-010',
        title: 'Invoice #INV-2024-045 - Merck Serono',
        supplier: 'Merck Serono',
        category: 'Invoice',
        room: 'B',
        rack: 'R2',
        shelf: 'S2',
        boxNumber: '6',
        status: 'Active',
      },
      {
        fileCode: 'SDF-011',
        title: 'Shipment Confirmation - Pfizer Q2',
        supplier: 'Pfizer',
        category: 'Shipment',
        room: 'C',
        rack: 'R1',
        shelf: 'S1',
        boxNumber: '2',
        status: 'Borrowed',
        notes: 'Borrowed by Logistics',
      },
      {
        fileCode: 'SDF-012',
        title: 'Product Profile - Sanofi New Line',
        supplier: 'Sanofi',
        category: 'PP',
        room: 'D',
        rack: 'R1',
        shelf: 'S1',
        boxNumber: '1',
        status: 'Active',
      },
    ];

    for (const file of archiveFiles) {
      await db.archiveFile.create({ data: file });
    }
    console.log('✅ Archive files seeded');
  }

  // Seed Users
  const existingUsers = await db.user.findMany();
  if (existingUsers.length === 0) {
    await db.user.createMany({
      data: [
        { username: 'admin', password: 'admin123', fullName: 'System Administrator', role: 'Admin', isActive: 1 },
        { username: 'johndoe', password: 'pass123', fullName: 'John Doe', role: 'Manager', isActive: 1 },
        { username: 'janearc', password: 'pass123', fullName: 'Jane Archer', role: 'Staff', isActive: 1 },
        { username: 'bobwilson', password: 'pass123', fullName: 'Bob Wilson', role: 'Staff', isActive: 0 },
      ],
    });
    console.log('✅ Users seeded');
  }

  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
