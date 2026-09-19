require "test_helper"

class FullStackFlowTest < ActionDispatch::IntegrationTest
  def create_user(email:, first_name:)
    User.create!(
      first_name: first_name,
      last_name: "Tester",
      email: email,
      password: "password123",
      password_confirmation: "password123",
      gender: "man",
      looking_for_friendship: true,
      looking_for_romance: true
    )
  end

  test "signup creates a real session and profile updates persist" do
    post api_signup_path,
      params: {
        user: {
          first_name: "Casey",
          last_name: "Member",
          email: "casey@example.com",
          password: "password123",
          password_confirmation: "password123",
          gender: "woman",
          looking_for_friendship: true,
          looking_for_romance: false
        }
      },
      as: :json

    assert_response :created

    user = User.find_by!(email: "casey@example.com")

    patch api_user_path(user),
      params: { user: { bio: "Updated bio", city: "Fort Myers" } },
      as: :json

    assert_response :success
    assert_equal "Updated bio", user.reload.bio
    assert_equal "Fort Myers", user.city

    get api_me_path, as: :json
    assert_response :success
    assert_equal user.id, JSON.parse(response.body).dig("user", "id")
  end

  test "signed in participant can create and reload a message" do
    sender = create_user(email: "sender@example.com", first_name: "Sender")
    recipient = create_user(email: "recipient@example.com", first_name: "Recipient")

    connection = Connection.create!(
      requester: sender,
      recipient: recipient,
      connection_type: "friendship",
      status: "accepted"
    )
    conversation = Conversation.create!(connection: connection)

    post api_session_path,
      params: { email: sender.email, password: "password123" },
      as: :json

    assert_response :success

    post api_conversation_messages_path(conversation),
      params: { message: { body: "This should persist." } },
      as: :json

    assert_response :created
    assert_equal "This should persist.", conversation.messages.last.body

    get api_conversation_path(conversation), as: :json
    assert_response :success

    bodies = JSON.parse(response.body).dig("conversation", "messages").map { |message| message["body"] }
    assert_includes bodies, "This should persist."
  end

  test "login response includes the complete profile" do
    user = create_user(email: "photo@example.com", first_name: "Photo")
    user.update!(
      profile_image_url: "data:image/jpeg;base64,example",
      bio: "Saved profile",
      city: "Fort Myers"
    )

    post api_session_path,
      params: { email: user.email, password: "password123" },
      as: :json

    assert_response :success

    payload = JSON.parse(response.body)
    body = payload.fetch("user")
    assert payload["csrf_token"].present?
    assert_equal user.profile_image_url, body["profile_image_url"]
    assert_equal "Saved profile", body["bio"]
    assert_equal "Fort Myers", body["city"]
  end

  test "removed connection stays removed when conversations reload" do
    sender = create_user(email: "remove-sender@example.com", first_name: "Remove")
    recipient = create_user(email: "mia@lastyearsingle.test", first_name: "Mia")

    connection = Connection.create!(
      requester: sender,
      recipient: recipient,
      connection_type: "friendship",
      status: "accepted"
    )
    Conversation.create!(connection: connection)

    post api_session_path,
      params: { email: sender.email, password: "password123" },
      as: :json

    assert_response :success

    delete api_connection_path(connection), as: :json
    assert_response :success
    assert_not Connection.exists?(connection.id)

    get api_conversations_path, as: :json
    assert_response :success
    assert_not Connection.exists?(connection.id)
  end

  test "users endpoint requires authentication" do
    get api_users_path, as: :json
    assert_response :unauthorized
  end
end
