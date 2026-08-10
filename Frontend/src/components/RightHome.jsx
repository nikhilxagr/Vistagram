import React from 'react'
import Messages from '../pages/Messages';

function RightHome() {
  return (
    <div className='w-[25%] hidden lg:block min-h-[100vh] bg-[black] border-r-2 border-gray-900'>
      <Messages />
    </div>
  )
}

export default RightHome;