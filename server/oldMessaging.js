router.post("/:groupId", fetchOrganizationId, async (req, res) => {
  try {
    const { ...messageLogData } = req.body;
    const groupId = req.params.groupId; 
    const organizationId = req.organizationId;
    messageLogData.organization_id = organizationId;
    messageLogData.is_sent_from_api = true;
    messageLogData.result = "Success";
    messageLogData.contact_group_id = groupId;

    const group = await ContactGroups.findById(groupId).populate('contacts', 'tims_username');
    if (!group) {
      return res.status(404).json({ error: "Qrup tapılmadı" });
    }

    const tims_usernames = group.contacts.map(contact => contact.tims_username);


    const sendBotMessage = async (messageData) => {
      try {
        const response = await fetch('https://ms.tims.gov.az/v1/bot/sendBotMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'accessToken': process.env.accessToken,
            'uuid': process.env.UUID,
          },
          body: JSON.stringify(messageData),
        });
    
        const responseData = await response.json();

        return responseData;
      } catch (error) {
        // console.error('Error sending bot message:', error);
        // throw new Error('Failed to send bot message');
      }
    };


    const messageData = {
      users: tims_usernames, 
      corporation: { id: [6487] },
      message: messageLogData.message,
      notification: true,
    };


    await sendBotMessage(messageData);


    const newMessageLog = new MessageLogs({ ...messageLogData });
    const savedMessageLog = await newMessageLog.save();

    if (!savedMessageLog) {
      throw new Error('Mesaj loqunun saxlanılması zamanı xəta baş verdi');
    }

    res.status(201).json({ savedMessageLog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server xətası" });
  }
});
