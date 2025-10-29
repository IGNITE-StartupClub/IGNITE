import SplitText from './SplitText';

export default function SplitTextWrapper(props) {
  const handleAnimationComplete = () => {
    console.log('All letters have animated!');
  };

  return (
    <SplitText 
      {...props} 
      onLetterAnimationComplete={handleAnimationComplete} 
    />
  );
}