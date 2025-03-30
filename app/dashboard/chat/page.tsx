'use client';

import { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Message {
  id: string;
  sender_id: string;
  course_id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

interface Course {
  id: string;
  title: string;
}

export default function ChatPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUserCourses();
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: selectedCourse ? `course_id=eq.${selectedCourse}` : undefined,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [selectedCourse]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchUserCourses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: participations, error: participationsError } = await supabase
      .from('course_participants')
      .select('course_id')
      .eq('user_id', user.id);

    if (participationsError) {
      console.error('Error fetching participations:', participationsError);
      return;
    }

    if (participations && participations.length > 0) {
      const courseIds = participations.map(p => p.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
      }

      setCourses(coursesData || []);
      if (coursesData && coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
      }
    }
  }

  useEffect(() => {
    if (selectedCourse) {
      fetchMessages();
    }
  }, [selectedCourse]);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('course_id', selectedCourse)
      .order('created_at');

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCourse) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        message: newMessage.trim(),
        course_id: selectedCourse,
        sender_id: user.id,
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-[calc(100vh-12rem)]">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          >
            <option value="">Kurs auswählen...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold text-sm">
                  {message.profiles?.username || 'Unbekannt'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleString('de-DE')}
                </span>
              </div>
              <p className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg inline-block">
                {message.message}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nachricht eingeben..."
              className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !selectedCourse}
              className="bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              Senden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
