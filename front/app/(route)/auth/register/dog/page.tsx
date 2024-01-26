'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMutation } from 'react-query';
import { useRecoilState } from 'recoil';
import { userState } from '@/app/_states/userState';
import { useRouter } from 'next/navigation';
import DateSelect, { DateSelectLabel } from '@/app/components/profile/DateSelect';
import { LOCAL_STORAGE_KEYS } from '@/app/constants/api';
import dayjs from 'dayjs';
import ProfileImg, { ProfileType } from '@/app/components/profile/ProfileImg';
import Input, { InputType } from '@/app/components/input/Input';
import styled from 'styled-components';
import Button from '@/app/components/button/Button';
import ContainerLayout from '@/app/components/layout/layout';
import TopNavigation from '@/app/components/navigation/TopNavigation';
import { IUser } from '@/app/_types/user/User';
import { IDog } from '@/app/_types/user/Dog';
import GenderSelect from '@/app/components/profile/GenderSelect';

const DogRegisterPage = () => {
  interface IRequestData {
    userRequest: IUser;
    dogRequest: IDog;
    homeName: string;
  }
  const router = useRouter();
  const [requestData, setRequestData] = useState<IRequestData>({
    userRequest: {},
    dogRequest: {
      name: '',
      gender: '',
      birthday: dayjs().format('YYYY-MM-DD'),
      weight: 0,
      imgUrl: 'src://',
    },
    homeName: '',
  });

  useEffect(() => {
    const storedUserRequest = sessionStorage.getItem('userRequestData');
    if (storedUserRequest) {
      setRequestData((prev) => ({
        ...prev,
        userRequest: JSON.parse(storedUserRequest),
      }));
    } else {
      router.push('/auth/register/user');
    }
  }, [router]);

  //필수입력 상태값
  const [requiredField, setRequiredField] = useState<{ name: boolean; gender: boolean; weight: boolean }>({
    name: false,
    gender: false,
    weight: false,
  });

  const handleSelectChange = (name: string, value: any) => {
    if (name === 'birthday' && value instanceof Date) {
      value = dayjs(value).format('YYYY-MM-DD');
    }

    const newData = {
      ...requestData,
      [name]: value,
    };

    setRequestData((prev) => {
      const updatedHomeName = name === 'name' ? `${value}네 집` : prev.homeName;

      return {
        ...prev,
        dogRequest: {
          ...prev.dogRequest,
          [name]: value,
        },
        homeName: updatedHomeName,
      };
    });

    console.log('업데이트 된 requestData:', newData);

    setRequiredField({
      ...requiredField,
      [name]: value !== '' && value !== null,
    });
  };

  //필수 입력란 체크 boolean
  const areAllFieldsFilled = requiredField.name && requiredField.gender && requiredField.weight;

  const [, setUser] = useRecoilState(userState);
  const postApi = (data: IRequestData) => {
    return axios.post('http://localhost:8080/api/users/register', data);
  };

  const mutation = useMutation(postApi, {
    onSuccess: (res) => {
      const resData = res.data.data;
      const accessToken = resData.token.accessToken;
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      console.log(accessToken);
      if (setUser) {
        setUser(resData.userResponse);
      }

      console.log('응답 데이터', resData);

      if (accessToken) {
        router.push('/');
      } else {
        console.error('accessToken이 응답에 포함되지 않았습니다.');
      }
    },
    onError: (error) => console.error('가입 실패:', error),
  });

  //signUp 요청 함수
  const handleSignUpClick = () => {
    if (requestData.userRequest) {
      mutation.mutate(requestData);
    }
  };

  return (
    <ContainerLayout>
      <TopNavigation />
      <ComponentsWrapper>
        <ProfileImg profileType={ProfileType.Dog} onValueChange={(value) => handleSelectChange('imgUrl', value)} />
        <Input inputType={InputType.DogName} onInputValue={(value) => handleSelectChange('name', value)} />
        <GenderSelect onValueChange={(value) => handleSelectChange('gender', value)} />
        <DateSelect onValueChange={(value) => handleSelectChange('birthday', value)} label={DateSelectLabel.Birthday} isRequired={false} />
        <Input inputType={InputType.Weight} onInputValue={(value) => handleSelectChange('weight', value)} />
        <ButtonWrapper>
          <Button onClick={handleSignUpClick} disabled={!areAllFieldsFilled}>
            가입 완료하기
          </Button>
        </ButtonWrapper>
      </ComponentsWrapper>
    </ContainerLayout>
  );
};

const ButtonWrapper = styled.div`
  margin-top: 40px;
`;

const ComponentsWrapper = styled.div`
  display: grid;
  grid-template-rows: repeat(4, minmax(20px, 1fr));
  grid-gap: 30px;
  justify-content: center;
  align-items: center;
  width: 390px;
  & > div:first-of-type {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;
export default DogRegisterPage;
