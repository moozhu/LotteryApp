import ShapeFireworks from './ShapeFireworks'

interface BackgroundEffectsProps {
  showFireworks?: boolean
  onFireworksComplete?: () => void
}

export default function BackgroundEffects({ 
  showFireworks, 
  onFireworksComplete 
}: BackgroundEffectsProps) {
  return (
    <>
      <ShapeFireworks 
        trigger={showFireworks} 
        onComplete={onFireworksComplete}
      />
    </>
  )
}
