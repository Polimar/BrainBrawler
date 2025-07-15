import { PrismaClient } from '@prisma/client';
import { AccountType, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // ============================================
  // Cleanup
  // ============================================
  console.log('🧹 Cleaning up database...');
  await prisma.gameParticipant.deleteMany();
  await prisma.game.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned');

  // ============================================
  // Create Users
  // ============================================
  console.log('👤 Creating users...');
  const password = await bcrypt.hash('password123', 10);
  
  const userEmails = [
    'admin@brainbrawler.com',
    'premium@brainbrawler.com',
    'free@brainbrawler.com',
    'tester@brainbrawler.com',
    ...Array.from({ length: 11 }, (_, i) => `user${i + 1}@brainbrawler.com`),
  ];

  const userPromises = userEmails.map((email, index) => {
    let accountType: AccountType = 'FREE';
    if (email.startsWith('admin')) accountType = 'ADMIN';
    if (email.startsWith('premium')) accountType = 'PREMIUM';

    return prisma.user.create({
      data: {
        email,
        username: email.split('@')[0],
        password,
        accountType,
        isEmailVerified: true,
      }
    });
  });

  const users = await Promise.all(userPromises);
  const [adminUser, premiumUser, freeUser1, freeUser2, ...otherUsers] = users;

  console.log(`✅ Created ${users.length} users`);

  // ============================================
  // Create Question Sets
  // ============================================
  console.log('📚 Creating question sets...');
  const scienceSet = await prisma.questionSet.create({
    data: {
      name: 'General Science',
      description: 'A mix of science questions.',
      category: 'Science',
      difficulty: Difficulty.MEDIUM,
      isPublic: true,
      ownerId: adminUser.id,
    },
  });

  const historySet = await prisma.questionSet.create({
    data: {
      name: 'World History',
      description: 'Questions about major historical events.',
      category: 'History',
      difficulty: Difficulty.HARD,
      isPublic: true,
      isPremium: true,
      ownerId: premiumUser.id,
    },
  });

  const movieSet = await prisma.questionSet.create({
    data: {
      name: 'Movie Buff Trivia',
      description: 'Test your knowledge of cinema.',
      category: 'Entertainment',
      difficulty: Difficulty.EASY,
      isPublic: true,
      ownerId: freeUser1.id,
    },
  });
  console.log('✅ Created 3 question sets');

  // ============================================
  // Create Questions
  // ============================================
  console.log('❓ Creating questions...');
  await prisma.question.createMany({
    data: [
      { questionSetId: scienceSet.id, text: 'What is the powerhouse of the cell?', options: '["Mitochondria", "Nucleus", "Ribosome"]', correctAnswer: 'Mitochondria', order: 1 },
      { questionSetId: scienceSet.id, text: 'What is H2O?', options: '["Salt", "Water", "Acid"]', correctAnswer: 'Water', order: 2 },
      { questionSetId: historySet.id, text: 'Who was the first US president?', options: '["Abraham Lincoln", "George Washington", "Thomas Jefferson"]', correctAnswer: 'George Washington', order: 1 },
      { questionSetId: historySet.id, text: 'In what year did WWII end?', options: '["1945", "1918", "1939"]', correctAnswer: '1945', order: 2 },
      { questionSetId: movieSet.id, text: 'Who directed "Pulp Fiction"?', options: '["Steven Spielberg", "Martin Scorsese", "Quentin Tarantino"]', correctAnswer: 'Quentin Tarantino', order: 1 },
      { questionSetId: movieSet.id, text: 'What is the highest-grossing film of all time?', options: '["Avatar", "Avengers: Endgame", "Titanic"]', correctAnswer: 'Avatar', order: 2 },
    ],
  });
  console.log('✅ Created 6 questions');

  // ============================================
  // Create a Sample Game
  // ============================================
  console.log('🎮 Creating a sample game...');
  await prisma.game.create({
    data: {
      code: 'DEMO01',
      questionSetId: scienceSet.id,
      creatorId: adminUser.id,
      maxPlayers: 8,
      isP2P: true,
    },
  });
  console.log('✅ Created sample game with code: DEMO01');

  // ============================================
  // Create Friendships and Requests
  // ============================================
  console.log('💌 Creating friend requests...');
  // Pending request
  await prisma.friendRequest.create({
    data: {
      senderId: freeUser1.id,
      receiverId: freeUser2.id,
    },
  });

  // Accepted request (friendship)
  await prisma.friendship.create({
    data: {
      user1Id: adminUser.id,
      user2Id: premiumUser.id,
      status: 'ACCEPTED', // Explicitly set status
    },
  });
  console.log('✅ Created 1 accepted friendship');
  
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 