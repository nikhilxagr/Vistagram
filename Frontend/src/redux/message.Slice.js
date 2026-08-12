import { createSlice } from "@reduxjs/toolkit"

const messageSlice=createSlice({
    name:"message",
    initialState:{
        selectedUser:null,
        messages:[],
    },
    reducers: {
    setSelectedUser: (state, action)=>{
        state.selectedUser=action.payload
    },
    setMessages: (state, action)=>{
        state.messages=action.payload
    }
    }
})

export const {setSelectedUser, setMessages}=messageSlice.actions
export default messageSlice.reducer