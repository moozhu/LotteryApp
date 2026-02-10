import ShapeFireworks from './ShapeFireworks'

interface BackgroundEffectsProps {
  showFireworks?: boolean
  onFireworksComplete?: () => void
  auto?: boolean
}

export default function BackgroundEffects({ 
  showFireworks, 
  onFireworksComplete,
  auto = true
}: BackgroundEffectsProps) {
  return (
    <>
      <ShapeFireworks 
        trigger={showFireworks} 
        onComplete={onFireworksComplete}
        auto={auto}
      />
    </>
  )
}
