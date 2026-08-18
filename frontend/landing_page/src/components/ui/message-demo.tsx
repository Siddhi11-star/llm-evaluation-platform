import {
  Message,
  MessageContent,
  MessageAvatar,
} from '@/components/ui/message';

export default function DemoOne() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* User Message */}
      <Message from="user">
        <MessageContent>
          Hello! Can you tell me what the current time is in Yieldry?
        </MessageContent>
        <MessageAvatar
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
          name="User"
        />
      </Message>

      {/* Assistant Message */}
      <Message from="assistant">
        <MessageContent>
          Of course! As of our conversation, the current time in Yieldry, Urenso is approximately 12:18 PM.
        </MessageContent>
        <MessageAvatar
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop"
          name="AI"
        />
      </Message>
    </div>
  );
}
