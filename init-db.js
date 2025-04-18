db = db.getSiblingDB('story');
db.createCollection('users');
db.createCollection('stories');

// Sample user
db.users.insertOne({
  email: 'test@example.com',
  name: 'Test User',
  password: 'test123',
  role: 'user',
  subscription: 'free',
  stories: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample story
db.stories.insertOne({
  title: 'Sample Story',
  content: 'This is a sample story content.',
  userId: 'test',
  settings: {
    timePeriod: 'Medieval',
    location: 'Castle',
    atmosphere: 'Mysterious',
    protagonistGender: 'Female',
    partnerGender: 'Male',
    relationship: 'Enemies to Lovers',
    writingTone: 'Dramatic',
    narrationVoice: 'Clara',
    length: 3
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isPublic: true,
  likes: 5,
  plays: 10
});

print('Database initialized with sample data.');