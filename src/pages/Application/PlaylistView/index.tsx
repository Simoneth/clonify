import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {ContentLoadingAnimation} from '../../../components/ContentLoadingAnimation';
import {Playlist} from '../../../entities/playlist';
import {getPlaylistFromAPI} from '../../../services/get-playlist-from-api';
import {Container, Wrapper, StickyGuard, Header, Cover, Info, Label, Name, Description, Owner } from './styles';
import {usePlayer} from "../../../hooks/use-player";
import {PlaylistTrackTable} from "../../../components/PlaylistTrackTable";
import {ApplicationStatus} from "../../../constants/application-status.enum";
import {useInView} from "react-intersection-observer";
import {Time} from "../../../utils/time";
import {TimeWithUnitsFormatter} from "../../../utils/time-with-units-formatter";
import {ButtonsBar} from "../../../components/ButtonsBar";
import { PlayerStatus } from '../../../constants/player-status.enum';


export function PlaylistView() {
  const {id} = useParams<{ id: string }>();
  const [ref, isGuardInView] = useInView({ threshold: 0 });
  const [playlist, setPlaylist] = useState<Playlist>();
  const [appStatus, setAppStatus] = useState<ApplicationStatus>(ApplicationStatus.LOADING);
  const { playTrack, tracks, setTracks, activeTrackId, status } = usePlayer([]);
  const time = Time.parseMillisecondsToTime(
      tracks.reduce((acc, cur) => acc + cur.duration, 0)
  );
  const formatter = new TimeWithUnitsFormatter();

  const playButtonClick = () => {
    const current = tracks.find(t => t.id === activeTrackId) ?? tracks[0];
    playTrack(current);
  }

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const playlist = await getPlaylistFromAPI(id);
        setPlaylist(playlist);
        setTracks(playlist.tracks);
        setAppStatus(ApplicationStatus.READY);
      } catch (err) {
        console.error(err);
        setAppStatus(ApplicationStatus.SOMETHING_WENT_WRONG);
      }
    };

    fetchPlaylist();
  }, [id, setTracks]);

  return (
      <Container>
        {
          appStatus === ApplicationStatus.LOADING &&
          <ContentLoadingAnimation className="loading-animation"/>
        }

        {
          appStatus === ApplicationStatus.READY &&
          <>
              <Header>
                  <StickyGuard ref={ref}/>
                  <Wrapper isStuck={!isGuardInView}>
                      <Cover src={playlist?.cover} isStuck={!isGuardInView}/>
                      <Info isStuck={!isGuardInView}>
                          <Label className='label'>Playlist</Label>
                          <Name isStuck={!isGuardInView}>{playlist?.name}</Name>
                          <Description className='description'>{playlist?.description}</Description>
                          <Owner className='owner'>Created by &nbsp;
                              <strong>{playlist?.ownerName}</strong>
                          </Owner>
                          <span className='tracks-info'>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}, &nbsp;</span>
                          <span className='time-info'>{formatter.format(time)}</span>
                      </Info>
                      <ButtonsBar
                        label={status === PlayerStatus.PLAYING ? 'Pause' : 'Play'} 
                        isLiked={playlist!.isLiked} 
                        onClick={playButtonClick}/>
                  </Wrapper>
              </Header>
              <PlaylistTrackTable tracks={tracks} playTrack={playTrack} activeTrackId={activeTrackId}/>
          </>
        }
      </Container>
  );
}
