'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { Database } from '@/types/supabase';

type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'] & {
  username?: string;
};
type Course = Database['public']['Tables']['courses']['Row'] & {
  title: string;
};

type MessageWithProfile = Message & {
  profiles: Profile | null;
  user_id?: string;
  content?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [message, setMessage] = useState('');
  const { user, loading } = useUser();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch user's courses
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .or(`trainer_id.eq.${user.id},course_participants.user_id.eq.${user.id}`)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }

      setCourses(data);
    };

    fetchCourses();

    // Subscribe to messages
    const channel = supabase.channel('messages');
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: selectedCourse ? `course_id=eq.${selectedCourse.id}` : undefined,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, selectedCourse]);

  const fetchMessages = async () => {
    if (!selectedCourse || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(*)')
        .eq('course_id', selectedCourse.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedCourse || !user) return;

    try {
      const { error } = await supabase.from('messages').insert({
        content: message.trim(),
        course_id: selectedCourse.id,
        user_id: user.id,
      });

      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the chat.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Course selection sidebar */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">Your Courses</h2>
          <div className="space-y-2">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`w-full text-left p-2 rounded ${
                  selectedCourse?.id === course.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {course.title}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="col-span-3 bg-white rounded-lg shadow">
          {selectedCourse ? (
            <>
              {/* Messages */}
              <div className="h-[600px] p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.user_id === user.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.user_id === user.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {msg.user_id === user.id ? 'You' : msg.profiles?.username}
                      </p>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 form-input"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a course to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
