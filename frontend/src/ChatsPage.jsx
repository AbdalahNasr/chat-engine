
import{MultiChatSocket,MultiChatWindow , useMultiChatLogic}from 'react-chat-engine-advanced'

const ChatPage = (props)=>{
    const chatProps = useMultiChatLogic('cfca5161-0851-4860-bc54-236a203c4db5',props.user.username,props.user.secret)
return (
<div style={{height:'100vh'}}>
    <MultiChatSocket {...chatProps}/>
    <MultiChatWindow {...chatProps} style={{height:'100%'}}/>
</div>

)
}
export default ChatPage