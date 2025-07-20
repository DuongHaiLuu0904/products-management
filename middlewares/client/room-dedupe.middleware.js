
export async function preventDuplicateRooms(req, res, next) {
    try {
        // This middleware will be called before rendering chat index
        // Additional cleanup logic can be added here if needed
        next()
    } catch (error) {
        console.error('Error in preventDuplicateRooms middleware:', error)
        next()
    }
}

export function getUniqueRoomsForUser(rooms, userId) {
    const uniqueRooms = []
    const seenFriends = new Set()

    for(const room of rooms) {
        const friendInfo = room.users.find(user => user.user_id != userId)
        if(friendInfo && !seenFriends.has(friendInfo.user_id)) {
            seenFriends.add(friendInfo.user_id)
            uniqueRooms.push(room)
        }
    }

    return uniqueRooms
}
