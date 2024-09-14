import { MdCallEnd } from 'react-icons/md';

function EndCallButton({ onEndCall }) {
  return (
    <button onClick={onEndCall} className="bg-red-500 text-white p-4 rounded-md">
      <div class="flex flex-column gap-2">
      <MdCallEnd className="w-6 h-6" />
      <p class="font-medium">Leave</p>
      </div>
    </button>
  );
}

export default EndCallButton;