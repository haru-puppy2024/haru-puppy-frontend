'use client'

import React, { useState } from 'react'
import NavMenu from './components/NavMenu'
import styled from 'styled-components'
import UpperUserProfile from './components/UpperUserProfile'
import ToggleSwitch from '@/app/components/toggle/ToggleSwitch'
import { useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import ContainerLayout from '@/app/components/layout/layout'
import TopNavigation from '@/app/components/navigation/TopNavigation'
import { BottomNavigation } from '@mui/material'
import { LOCAL_STORAGE_KEYS } from '@/app/constants/auth'
import { useRouter } from 'next/navigation'
import Modal from '@/app/components/modal/modal'


const UserDummy = {
    nickname: '이로',
    role: '엄마',
    profileImg: '/svgs/user_profile.svg'
}

const page = () => {
    const [isToggled, setIsToggled] = useState(false);
    const [isLogoutModalOpen, setLogoutIsModalOpen] = useState(false);

    const queryClient = useQueryClient();
    const router = useRouter();


    //알림 설정 fetcher 함수
    const fetchNotification = async (active: boolean, accessToken: string | null) => {
        try {
            const response = await axios.put(
                `/api/notifications?active=${active}`,
                null,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response) {
                console.error('알림 설정 요청 실패');
                throw new Error('알림 설정 요청 실패');
            }

            return response.data;
        } catch (error) {
            console.error('알림 설정을 요청하는 중 에러가 발생했습니다:', error);
            throw error;
        }
    };


    const { mutate } = useMutation(
        (active: boolean) => fetchNotification(active, localStorage.getItem('access_token')),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('notifications');
            },
        }
    );

    //토글 함수
    const handelToggle = (toggled: boolean) => {
        setIsToggled(toggled)
        mutate(toggled);
    }


    const handleMateInvite = () => {
        router.push('/invite')
    }


    const toggleModal = () => {
        setLogoutIsModalOpen(!isLogoutModalOpen)
    }

    return (
        <>
            <TopNavigation />
            <Wrapper>
                <UpperUserProfile user={UserDummy} />
                <MenuWrapper>
                    <NavMenu title='알림 설정' >
                        <ToggleSwitch onToggle={handelToggle} isToggled={isToggled} />
                    </NavMenu>
                    <NavMenu title='로그아웃' onClick={toggleModal} />
                    {isLogoutModalOpen && (
                        <Modal
                            children="로그아웃하시겠습니까?"
                            btn1="취소"
                            btn2="로그아웃"
                            onClose={toggleModal}
                        />
                    )}
                    <NavMenu title='회원 탈퇴' />
                    <NavMenu title='메이트 초대하기' onClick={handleMateInvite} />
                </MenuWrapper>
            </Wrapper>
            <BottomNavigation />
        </>
    )
}


const MenuWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`

const Wrapper = styled.div`
    display: flex;  
    flex-direction: column;
    justify-items: center;
    align-items: center;
   margin-top: 50px;
`
export default page

