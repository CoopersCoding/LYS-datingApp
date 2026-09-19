interests = [
  ["Faith", "Values"],
  ["Travel", "Lifestyle"],
  ["Live music", "Entertainment"],
  ["Local food", "Lifestyle"],
  ["Walking", "Fitness"],
  ["Volunteering", "Community"],
  ["Fitness", "Fitness"],
  ["Outdoors", "Lifestyle"],
  ["Coffee", "Lifestyle"]
].map do |name, category|
  Interest.find_or_create_by!(name: name) do |interest|
    interest.category = category
  end
end

profiles = [
  {
    first_name: "Brian", last_name: "Demo", email: "demo@lastyearsingle.test",
    gender: "man", city: "Fort Myers", state: "Florida",
    bio: "Demo account for the Last Year Single capstone.",
    looking_for_friendship: true, looking_for_romance: true
  },
  {
    first_name: "Maya", last_name: "Reed", email: "maya@lastyearsingle.test",
    gender: "woman", city: "Fort Myers", state: "Florida",
    bio: "Community-minded, curious, and always planning the next weekend adventure.",
    profile_image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Daniel", last_name: "Brooks", email: "daniel@lastyearsingle.test",
    gender: "man", city: "Cape Coral", state: "Florida",
    bio: "Enjoys good conversation, the outdoors, and staying active.",
    profile_image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Olivia", last_name: "Hart", email: "olivia@lastyearsingle.test",
    gender: "woman", city: "Naples", state: "Florida",
    bio: "Faith, travel, and trying new restaurants are always a good start.",
    profile_image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Marcus", last_name: "Cole", email: "marcus@lastyearsingle.test",
    gender: "man", city: "Bonita Springs", state: "Florida",
    bio: "Looking for a meaningful relationship built on shared values.",
    profile_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Mia", last_name: "Stone", email: "mia@lastyearsingle.test",
    gender: "woman", city: "Fort Myers", state: "Florida",
    bio: "Travel, live music, and local food make a great weekend.",
    profile_image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Noah", last_name: "Grant", email: "noah@lastyearsingle.test",
    gender: "man", city: "Cape Coral", state: "Florida",
    bio: "Volunteering, fitness, and being outdoors keep life grounded.",
    profile_image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Sofia", last_name: "Lane", email: "sofia@lastyearsingle.test",
    gender: "woman", city: "Naples", state: "Florida",
    bio: "Travel, faith, and great food are three of my favorite things.",
    profile_image_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=700&q=85",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Ethan", last_name: "Parker", email: "ethan@lastyearsingle.test",
    gender: "man", city: "Cape Coral", state: "Florida",
    bio: "Weekend boating, good coffee, and finding new places to eat are my speed.",
    profile_image_url: "https://i.pravatar.cc/700?img=12",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Ava", last_name: "Collins", email: "ava@lastyearsingle.test",
    gender: "woman", city: "Fort Myers", state: "Florida",
    bio: "I love live music, long walks, volunteering, and people who actually make plans.",
    profile_image_url: "https://i.pravatar.cc/700?img=16",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Lucas", last_name: "Bennett", email: "lucas@lastyearsingle.test",
    gender: "man", city: "Estero", state: "Florida",
    bio: "Outdoors, fitness, local food, and a relaxed weekend with good people.",
    profile_image_url: "https://i.pravatar.cc/700?img=11",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Grace", last_name: "Turner", email: "grace@lastyearsingle.test",
    gender: "woman", city: "Bonita Springs", state: "Florida",
    bio: "Faith, travel, coffee, and meaningful conversation are a pretty great combination.",
    profile_image_url: "https://i.pravatar.cc/700?img=32",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Owen", last_name: "Carter", email: "owen@lastyearsingle.test",
    gender: "man", city: "Naples", state: "Florida",
    bio: "I am happiest outside, near the water, or trying a restaurant I have never been to.",
    profile_image_url: "https://i.pravatar.cc/700?img=15",
    looking_for_friendship: true, looking_for_romance: false
  },
  {
    first_name: "Chloe", last_name: "Martin", email: "chloe@lastyearsingle.test",
    gender: "woman", city: "Fort Myers", state: "Florida",
    bio: "Warm, curious, and always up for travel, coffee, or a spontaneous day trip.",
    profile_image_url: "https://i.pravatar.cc/700?img=47",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Natalie", last_name: "Reed", email: "natalie@lastyearsingle.test",
    gender: "woman", city: "Cape Coral", state: "Florida",
    bio: "I value faith, kindness, staying active, and laughing a lot.",
    profile_image_url: "https://i.pravatar.cc/700?img=44",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Emma", last_name: "Hayes", email: "emma@lastyearsingle.test",
    gender: "woman", city: "Estero", state: "Florida",
    bio: "Travel, live music, fitness, and a great dinner are hard to beat.",
    profile_image_url: "https://i.pravatar.cc/700?img=45",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Lauren", last_name: "Foster", email: "lauren@lastyearsingle.test",
    gender: "woman", city: "Naples", state: "Florida",
    bio: "I enjoy volunteering, the outdoors, local food, and conversations that go somewhere.",
    profile_image_url: "https://i.pravatar.cc/700?img=49",
    looking_for_friendship: false, looking_for_romance: true
  },
  {
    first_name: "Rachel", last_name: "Brooks", email: "rachel@lastyearsingle.test",
    gender: "woman", city: "Bonita Springs", state: "Florida",
    bio: "Coffee, walking, travel, and faith are four things that make life better.",
    profile_image_url: "https://i.pravatar.cc/700?img=48",
    looking_for_friendship: false, looking_for_romance: true
  }
]

users = profiles.index_with do |attributes|
  email = attributes[:email]
  user = User.find_or_initialize_by(email: email)
  user.assign_attributes(attributes.except(:email))
  user.password = "password123" if user.new_record?
  user.password_confirmation = "password123" if user.new_record?
  user.save!
  user
end

users.each_value do |user|
  user.interests = interests.sample(4) if user.interests.empty?
end

demo = users[profiles.first]
[
  [users[profiles[5]], "friendship"],
  [users[profiles[6]], "friendship"],
  [users[profiles[7]], "romantic"]
].each do |other_user, connection_type|
  connection = Connection.find_or_initialize_by(requester: demo, recipient: other_user)
  connection.connection_type = connection_type
  connection.status = "accepted"
  connection.save!

  conversation = Conversation.find_or_create_by!(connection: connection)

  next unless conversation.messages.empty?

  sample_messages = case other_user.first_name
                    when "Mia"
                      [
                        [other_user, "Have you tried that little coffee place downtown yet?"],
                        [demo, "Not yet, but I keep hearing about it. Worth going?"],
                        [other_user, "Definitely. Saturday?"]
                      ]
                    when "Noah"
                      [
                        [other_user, "You mentioned you like being near the water."],
                        [demo, "Absolutely. It is one of my favorite ways to reset."]
                      ]
                    else
                      [
                        [other_user, "I think travel tells you a lot about a person."],
                        [demo, "Agreed. Especially how people handle the unexpected."]
                      ]
                    end

  sample_messages.each do |sender, body|
    conversation.messages.create!(user: sender, body: body)
  end
end
