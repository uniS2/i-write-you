/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { mq } from '@/style/mq';
import { Common } from '@/style/Common';
import FriendButton from './FriendButton';
import { SrOnlyStyle } from '@/pages/Login';
import { FriendListItem, FriendListNumber } from './FriendList';
import { FriendRequestBtnBox } from './FriendReceived';
import { supabase } from '@/client';
import { useRecoilState } from 'recoil';
import { myInfoState } from '@/recoil/atom/useFriend';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function FriendRequestForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [myInfo] = useRecoilState(myInfoState);
  const [filterUserInfo, setFilterUsersInfo] = useState<infoType[]>([]);
  const [fList, setFriendList] = useState<string[]>([]);

  useEffect(() => {
    const fetchFriendList = async () => {
      try {
        const { data } = await supabase
          .from('friends')
          .select('*')
          .or(`senderId.eq.${myInfo.id},receiverId.eq.${myInfo.id}`);

        const friendList = data!.map((i) => {
          return i.senderId === myInfo.id ? i.receiverName : i.senderName;
        });

        setFriendList(friendList);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriendList();
  }, [myInfo.id]);

  const handleFriendRequest = useCallback(
    async (value: infoType) => {
      const { error } = await supabase.from('friends').upsert([
        {
          senderId: myInfo.id,
          senderName: myInfo.email,
          receiverId: value.id,
          receiverName: value.name,
          status: false,
        },
      ]);
      if (error) {
        console.error('업데이트 중 오류 발생: ', error);
      } else {
        const filterUser = filterUserInfo.filter(
          (user) => user.name !== value.name
        );

        setFilterUsersInfo(filterUser);

        toast.success(`${value.name} 님에게 친구 신청이 완료되었습니다.`);
      }
    },
    [myInfo.id, myInfo.email, filterUserInfo]
  );

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      toast.error('검색어를 입력해주세요.');
      setFilterUsersInfo([]);
      return;
    }

    const { data, error } = await supabase
      .from('userInfo')
      .select('*')
      .or(`userEmail.ilike.%${searchTerm}%,hotelName.ilike.%${searchTerm}%`);

    if (data?.length === 0) {
      toast.error('검색된 호텔이 없습니다. 정확히 입력해주세요.');
      setFilterUsersInfo([]);
      return;
    }

    if (data && data.length > 0) {
      const usersInfoData = data.map((item) => ({
        id: item.id,
        name: item.hotelName,
        email: item.userEmail,
      }));

      const filterUser = usersInfoData.filter((i) => {
        return i.id !== myInfo.id && !fList.includes(i.name);
      });

      setFilterUsersInfo(filterUser);
    }

    if (error) {
      console.error('error', error);
    }
  };

  return (
    <>
      <form css={Requestform}>
        <label css={SrOnlyStyle} htmlFor="friendRequest">
          친구 요청 보내기
        </label>

        <input
          css={FriendRequestInput}
          id="friendRequest"
          name="friendRequest"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="호텔 이름 혹은 이메일을 입력해주세요."
          maxLength={50}
        />

        <FriendButton
          size="small"
          colorType="default"
          type="button"
          onClick={handleSearch}
        >
          검색
        </FriendButton>
      </form>
      <ul>
        {filterUserInfo.length !== 0 &&
          filterUserInfo.map((value, index) => {
            return (
              <li key={index} css={FriendListItem}>
                <div css={FriendListNumber}>
                  <span css={SrOnlyStyle}>{index}</span>
                </div>
                <span>
                  {value.name} <span css={friendList}>{value.email}</span>
                </span>

                <div css={FriendRequestBtnBox}>
                  <FriendButton
                    size="small"
                    colorType="default"
                    onClick={() => handleFriendRequest(value)}
                  >
                    친구 요청
                  </FriendButton>
                </div>
              </li>
            );
          })}
      </ul>
    </>
  );
}

const friendList = css`
  font-size: 1rem;
`;

export const Requestform = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
  & > img {
    position: absolute;
    right: 10px;
    top: 5px;
  }
  ${mq({
    height: ['38px', '43px', '46px', '48px'],
  })}
`;

export const FriendRequestInput = css`
  ::placeholder {
    color: ${Common.colors.lightMint};
  }
  :focus {
    border: 2px solid ${Common.colors.lightMint};
  }
  outline: none;

  background: url('/noPass.png') no-repeat;
  background: url('/pass.png') no-repeat;
  background-position: right 10px top 50%;
  background-size: 6%;

  padding: 0 60px 0 20px;
  border: none;
  border-radius: 25px;
  background-color: white;

  color: ${Common.colors.lightMint};

  ${mq({
    '&::placeholder': {
      fontSize: ['16px', '20px', '20px', ' 22px'],
    },
    fontSize: ['20px', '22px', '23px', ' 24px'],
    width: ['55%', '59%', '63%', '67%'],
    height: ['33px', '43px', '43px', '45px'],
    marginBottom: ['8px', '20px', '20px', '30px'],
  })}
`;
