
import Header from './components/Header';
import VideoFeed from './components/VideoFeed';
import Duck from './components/Duck';
import Footer from './components/Footer';
import Chat from './components/Chat'
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="relative h-screen flex bg-white dark:bg-neutral-900">
      <div><Toaster/></div>
      <div className="flex flex-col w-4/5 pt-8 h-full">
        <Header />
        <div className="flex-grow">
          <VideoFeed />
          <Duck/>
        </div>
        <Footer/>
      </div>
      <Chat/>
    </div>
  );
}

export default App;