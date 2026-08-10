import { createSlice } from "@reduxjs/toolkit"

const messageSlice=createSlice({
    name:"message",
    initialState:{
    selectedUser:null,
    },
    reducers: {
    setSelectedUser: (state, action)=>{
        state.selectedUser=action.payload
    }
}
})

export const {setSelectedUser}=messageSlice.actions
export default messageSlice.reducer