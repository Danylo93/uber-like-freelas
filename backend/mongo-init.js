// MongoDB initialization script
db = db.getSiblingDB('marketplace');

// Create collections
db.createCollection('users');
db.createCollection('service_requests');
db.createCollection('service_offers');
db.createCollection('chats');
db.createCollection('messages');
db.createCollection('reviews');
db.createCollection('notifications');
db.createCollection('service_rejections');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "id": 1 }, { unique: true });
db.service_requests.createIndex({ "client_id": 1 });
db.service_requests.createIndex({ "status": 1 });
db.service_requests.createIndex({ "category": 1 });
db.service_offers.createIndex({ "provider_id": 1 });
db.service_offers.createIndex({ "service_request_id": 1 });
db.chats.createIndex({ "participants": 1 });
db.messages.createIndex({ "chat_id": 1 });
db.messages.createIndex({ "timestamp": 1 });
db.reviews.createIndex({ "service_request_id": 1 });
db.reviews.createIndex({ "provider_id": 1 });
db.notifications.createIndex({ "user_id": 1 });
db.notifications.createIndex({ "created_at": 1 });

// Create default admin user (optional)
db.users.insertOne({
  "id": "admin-user-123",
  "email": "admin@marketplace.com", 
  "name": "Admin User",
  "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewNSPVy2BY9sHECO", // password123
  "role": "admin",
  "created_at": new Date(),
  "updated_at": new Date(),
  "is_active": true,
  "rating": 5.0
});

print('✅ Database initialized successfully');
print('✅ Collections created');
print('✅ Indexes created');
print('✅ Admin user created (admin@marketplace.com / password123)');